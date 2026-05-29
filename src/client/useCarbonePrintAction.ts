import { useField, useFieldSchema, useForm } from '@formily/react';
import {
  useBlockContext,
  useCollectionRecordData,
  useDataBlockResource,
} from '@nocobase/client';
import { App } from 'antd';
import { saveAs } from 'file-saver';
import { useCarbonePrintTranslation } from './locale';

const getFilename = (header?: string) => {
  if (!header) {
    return null;
  }
  const match = header.match(/filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/i);
  const raw = match?.[1] || match?.[2];
  return raw ? decodeURIComponent(raw) : null;
};

const getAttachmentId = (value: any) => {
  const attachment = Array.isArray(value) ? value[0] : value;
  return attachment?.id || attachment?.data?.id || attachment?.response?.data?.id || attachment?.file?.id;
};

export const useCarbonePrintAction = () => {
  const field = useField();
  const fieldSchema = useFieldSchema();
  const form = useForm();
  const recordData = useCollectionRecordData();
  const resource = useDataBlockResource();
  const { name: blockType } = useBlockContext() || {};
  const { message } = App.useApp();
  const { t } = useCarbonePrintTranslation();

  return {
    async onClick() {
      field.data = field.data || {};
      field.data.loading = true;

      try {
        const settings = fieldSchema?.['x-action-settings'] || {};
        const currentRecord = blockType === 'form' ? form.values : recordData;
        const templateId = settings.templateId || getAttachmentId(settings.template);

        if (!templateId) {
          message.error(t('Please select a Carbone template first'));
          return;
        }

        const response = await (resource as any).carbonePrint(
          {
            values: {
              settings: {
                ...settings,
                templateId,
              },
              currentRecord: {
                id: currentRecord?.id,
              },
              $nForm: blockType === 'form' ? form.values : undefined,
            },
          },
          {
            responseType: 'blob',
          },
        );

        const blob = response?.data instanceof Blob ? response.data : new Blob([response?.data]);
        const filename = getFilename(response?.headers?.['content-disposition']) || `document.${settings.outputFormat || 'pdf'}`;
        saveAs(blob, filename);
      } catch (error) {
        console.error(error);
        message.error(t('Error generating document'));
      } finally {
        field.data.loading = false;
      }
    },
  };
};
