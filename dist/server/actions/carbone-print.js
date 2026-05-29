/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var carbone_print_exports = {};
__export(carbone_print_exports, {
  carbonePrint: () => carbonePrint
});
module.exports = __toCommonJS(carbone_print_exports);
var import_filtrex = require("filtrex");
var import_promises = __toESM(require("fs/promises"));
var import_fs = __toESM(require("fs"));
var import_os = __toESM(require("os"));
var import_path = __toESM(require("path"));
var import_promises2 = require("stream/promises");
var import_consumers = require("node:stream/consumers");
var import_carbone_sdk = __toESM(require("carbone-sdk"));
const carboneSDK = (0, import_carbone_sdk.default)();
const allowedOutputFormats = /* @__PURE__ */ new Set(["pdf", "docx"]);
const getFirstAttachment = (value) => {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
};
const getAttachmentId = (value) => {
  var _a, _b, _c, _d;
  const attachment = getFirstAttachment(value);
  return (attachment == null ? void 0 : attachment.id) || ((_a = attachment == null ? void 0 : attachment.data) == null ? void 0 : _a.id) || ((_c = (_b = attachment == null ? void 0 : attachment.response) == null ? void 0 : _b.data) == null ? void 0 : _c.id) || ((_d = attachment == null ? void 0 : attachment.file) == null ? void 0 : _d.id);
};
const getContentType = (format) => {
  if (format === "pdf") {
    return "application/pdf";
  }
  return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
};
const getDownloadName = (attachment, outputFormat) => {
  const sourceName = (attachment == null ? void 0 : attachment.title) || (attachment == null ? void 0 : attachment.filename) || "document";
  const baseName = import_path.default.basename(sourceName, import_path.default.extname(sourceName));
  return `${baseName}.${outputFormat}`;
};
const writeTemplateToTempFile = async (stream, attachment) => {
  const tmpDir = await import_promises.default.mkdtemp(import_path.default.join(import_os.default.tmpdir(), "nocobase-carbone-print-"));
  const filename = (attachment == null ? void 0 : attachment.filename) || `template${(attachment == null ? void 0 : attachment.extname) || ".docx"}`;
  const filePath = import_path.default.join(tmpDir, import_path.default.basename(filename));
  await (0, import_promises2.pipeline)(stream, import_fs.default.createWriteStream(filePath));
  return { tmpDir, filePath };
};
const applyAppendFilters = (record, appends) => {
  for (const append of appends || []) {
    if (!(append == null ? void 0 : append.name) || !append.filter || !Array.isArray(record == null ? void 0 : record[append.name])) {
      continue;
    }
    const filter = (0, import_filtrex.compileExpression)(append.filter);
    record[append.name] = record[append.name].filter(filter);
  }
};
async function carbonePrint(ctx, next) {
  var _a, _b, _c, _d, _e, _f;
  const params = ctx.action.params || {};
  const values = params.values || {};
  const settings = values.settings || {};
  const outputFormat = settings.outputFormat || "pdf";
  if (!allowedOutputFormats.has(outputFormat)) {
    ctx.throw(400, "Unsupported output format");
  }
  let attachmentId = settings.templateId || getAttachmentId(settings.template);
  if (settings.templateRefId) {
    const templateRecord = await ctx.db.getRepository("carbonePrintTemplates").findOne({
      filterByTk: settings.templateRefId,
      appends: ["attachment"]
    });
    const templateData = ((_a = templateRecord == null ? void 0 : templateRecord.toJSON) == null ? void 0 : _a.call(templateRecord)) || templateRecord;
    if (!templateData || templateData.isActive === false) {
      ctx.throw(404, "Template record not found or disabled");
    }
    attachmentId = templateData.attachmentId || ((_b = templateData.attachment) == null ? void 0 : _b.id) || attachmentId;
  }
  if (!attachmentId) {
    ctx.throw(400, ctx.t("Please select a Carbone template first", { ns: "action-carbone-print" }));
  }
  const attachment = await ctx.db.getRepository("attachments").findOne({
    filterByTk: attachmentId
  });
  if (!attachment) {
    ctx.throw(404, "Template attachment not found");
  }
  const fileManager = ctx.app.pm.get("file-manager");
  if (!(fileManager == null ? void 0 : fileManager.getFileStream)) {
    ctx.throw(500, "File Manager plugin is required");
  }
  const repository = ctx.getCurrentRepository();
  const dataSource = ctx.dataSource;
  const collection = repository.collection;
  const recordId = ((_c = values.currentRecord) == null ? void 0 : _c.id) ?? params.filterByTk;
  if (!recordId) {
    ctx.throw(400, "Current record id is required");
  }
  const appends = Array.isArray(settings.appends) ? settings.appends.filter((item) => item == null ? void 0 : item.name) : [];
  const currentRecord = (_d = await repository.findOne({
    filterByTk: recordId,
    appends: appends.map((append) => append.name)
  })) == null ? void 0 : _d.toJSON();
  if (!currentRecord) {
    ctx.throw(404, "Current record not found");
  }
  applyAppendFilters(currentRecord, appends);
  const file = attachment.toJSON();
  const { stream } = await fileManager.getFileStream(file);
  const { tmpDir, filePath } = await writeTemplateToTempFile(stream, file);
  carboneSDK.setOptions({
    carboneUrl: process.env.CARBONE_BASE || "http://localhost:4000/"
  });
  try {
    const carboneStream = carboneSDK.render(
      filePath,
      {
        data: {
          currentRecord,
          currentUser: (_e = ctx.auth) == null ? void 0 : _e.user,
          currentTime: (/* @__PURE__ */ new Date()).toISOString(),
          $nForm: values.$nForm,
          $nToken: (_f = ctx.getBearerToken) == null ? void 0 : _f.call(ctx),
          collectionName: collection.name,
          dataSourceKey: dataSource == null ? void 0 : dataSource.key
        },
        convertTo: outputFormat
      },
      {
        headers: {
          "carbone-template-delete-after": "0"
        }
      }
    );
    const body = await (0, import_consumers.buffer)(carboneStream);
    const filename = getDownloadName(file, outputFormat);
    ctx.withoutDataWrapping = true;
    ctx.set("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
    ctx.set("Content-Type", getContentType(outputFormat));
    ctx.body = body;
    this.logger.info(`carbonePrint:${collection.name}:${recordId} rendered ${filename}`);
  } catch (error) {
    this.logger.error(`carbonePrint:${collection.name}:${recordId} failed`, error);
    throw error;
  } finally {
    await import_promises.default.rm(tmpDir, { recursive: true, force: true });
  }
  await next();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  carbonePrint
});
