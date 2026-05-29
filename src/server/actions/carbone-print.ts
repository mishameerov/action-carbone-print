import { Context, Next } from '@nocobase/actions';
import { Repository } from '@nocobase/database';
import { DataSource } from '@nocobase/data-source-manager';
import { compileExpression } from 'filtrex';
import fs from 'fs/promises';
import fsSync from 'fs';
import os from 'os';
import path from 'path';
import { pipeline } from 'stream/promises';
import { buffer } from 'node:stream/consumers';
import carbone from 'carbone-sdk';
import { PluginActionCarbonePrintServer } from '../plugin';

const carboneSDK = carbone();
const allowedOutputFormats = new Set(['pdf', 'docx']);

type PrintSettings = {
  template?: any[] | any;
  templateId?: number | string;
  templateRefId?: number | string;
  outputFormat?: string;
  appends?: Array<{ name?: string; filter?: string }>;
};

const getFirstAttachment = (value: any) => {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
};

const getAttachmentId = (value: any) => {
  const attachment = getFirstAttachment(value);
  return attachment?.id || attachment?.data?.id || attachment?.response?.data?.id || attachment?.file?.id;
};

const getContentType = (format: string) => {
  if (format === 'pdf') {
    return 'application/pdf';
  }
  return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
};

const getDownloadName = (attachment: any, outputFormat: string) => {
  const sourceName = attachment?.title || attachment?.filename || 'document';
  const baseName = path.basename(sourceName, path.extname(sourceName));
  return `${baseName}.${outputFormat}`;
};

const writeTemplateToTempFile = async (stream: NodeJS.ReadableStream, attachment: any) => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'nocobase-carbone-print-'));
  const filename = attachment?.filename || `template${attachment?.extname || '.docx'}`;
  const filePath = path.join(tmpDir, path.basename(filename));
  await pipeline(stream, fsSync.createWriteStream(filePath));
  return { tmpDir, filePath };
};

const applyAppendFilters = (record: any, appends: PrintSettings['appends']) => {
  for (const append of appends || []) {
    if (!append?.name || !append.filter || !Array.isArray(record?.[append.name])) {
      continue;
    }
    const filter = compileExpression(append.filter);
    record[append.name] = record[append.name].filter(filter);
  }
};

export async function carbonePrint(this: PluginActionCarbonePrintServer, ctx: Context, next: Next) {
  const params = ctx.action.params || {};
  const values = params.values || {};
  const settings: PrintSettings = values.settings || {};
  const outputFormat = settings.outputFormat || 'pdf';

  if (!allowedOutputFormats.has(outputFormat)) {
    ctx.throw(400, 'Unsupported output format');
  }

  let attachmentId = settings.templateId || getAttachmentId(settings.template);

  if (settings.templateRefId) {
    const templateRecord = await ctx.db.getRepository('carbonePrintTemplates').findOne({
      filterByTk: settings.templateRefId,
      appends: ['attachment'],
    });
    const templateData = templateRecord?.toJSON?.() || templateRecord;
    if (!templateData || templateData.isActive === false) {
      ctx.throw(404, 'Template record not found or disabled');
    }
    attachmentId = templateData.attachmentId || templateData.attachment?.id || attachmentId;
  }

  if (!attachmentId) {
    ctx.throw(400, ctx.t('Please select a Carbone template first', { ns: 'action-carbone-print' }));
  }

  const attachment = await ctx.db.getRepository('attachments').findOne({
    filterByTk: attachmentId,
  });

  if (!attachment) {
    ctx.throw(404, 'Template attachment not found');
  }

  const fileManager = ctx.app.pm.get('file-manager') as any;
  if (!fileManager?.getFileStream) {
    ctx.throw(500, 'File Manager plugin is required');
  }

  const repository = ctx.getCurrentRepository() as Repository;
  const dataSource = ctx.dataSource as DataSource;
  const collection = repository.collection;
  const recordId = values.currentRecord?.id ?? params.filterByTk;

  if (!recordId) {
    ctx.throw(400, 'Current record id is required');
  }

  const appends = Array.isArray(settings.appends) ? settings.appends.filter((item) => item?.name) : [];
  const currentRecord = (
    await repository.findOne({
      filterByTk: recordId,
      appends: appends.map((append) => append.name),
    })
  )?.toJSON();

  if (!currentRecord) {
    ctx.throw(404, 'Current record not found');
  }

  applyAppendFilters(currentRecord, appends);

  const file = attachment.toJSON();
  const { stream } = await fileManager.getFileStream(file);
  const { tmpDir, filePath } = await writeTemplateToTempFile(stream, file);

  carboneSDK.setOptions({
    carboneUrl: process.env.CARBONE_BASE || 'http://localhost:4000/',
  });

  try {
    const carboneStream = carboneSDK.render(
      filePath,
      {
        data: {
          currentRecord,
          currentUser: ctx.auth?.user,
          currentTime: new Date().toISOString(),
          $nForm: values.$nForm,
          $nToken: ctx.getBearerToken?.(),
          collectionName: collection.name,
          dataSourceKey: dataSource?.key,
        },
        convertTo: outputFormat,
      },
      {
        headers: {
          'carbone-template-delete-after': '0',
        },
      },
    );
    const body = await buffer(carboneStream);
    const filename = getDownloadName(file, outputFormat);

    ctx.withoutDataWrapping = true;
    ctx.set('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    ctx.set('Content-Type', getContentType(outputFormat));
    ctx.body = body;
    this.logger.info(`carbonePrint:${collection.name}:${recordId} rendered ${filename}`);
  } catch (error) {
    this.logger.error(`carbonePrint:${collection.name}:${recordId} failed`, error);
    throw error;
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }

  await next();
}
