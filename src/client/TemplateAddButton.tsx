import { useForm } from '@formily/react';
import { useAPIClient } from '@nocobase/client';
import { App, Button } from 'antd';
import React from 'react';
import { useCarbonePrintTranslation } from './locale';

const getAttachmentId = (value: any) => {
  const attachment = Array.isArray(value) ? value[0] : value;
  return attachment?.id || attachment?.data?.id || attachment?.response?.data?.id || attachment?.file?.id;
};

export const TemplateAddButton: React.FC = () => {
  const form = useForm();
  const api = useAPIClient();
  const { message } = App.useApp();
  const { t } = useCarbonePrintTranslation();

  const onAdd = async () => {
    const title = form.values?.templateDraftTitle;
    const templateValue = form.values?.template;
    const attachmentId = getAttachmentId(templateValue);

    if (!title || !attachmentId) {
      message.error(t('Fill template name and upload DOCX first'));
      return;
    }

    await api.resource('carbonePrintTemplates').create({
      values: {
        title,
        attachmentId,
        isActive: true,
      },
    });

    form.setValues({
      ...form.values,
      templateDraftTitle: '',
      template: [],
      templateLibraryRefreshKey: Date.now(),
    });

    message.success(t('Template added to library'));
  };

  return <Button onClick={onAdd}>{t('Add')}</Button>;
};

export default TemplateAddButton;
