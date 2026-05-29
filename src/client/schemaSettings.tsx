import { ArrayItems } from '@formily/antd-v5';
import { ISchema, useFieldSchema } from '@formily/react';
import {
  ButtonEditor,
  SchemaSettings,
  SchemaSettingsLinkageRules,
  useDesignable,
  useSchemaToolbar,
} from '@nocobase/client';
import { useTranslation } from 'react-i18next';
import { NAMESPACE, tStr } from './locale';

const getAttachmentId = (value: any) => {
  const attachment = Array.isArray(value) ? value[0] : value;
  return attachment?.id || attachment?.data?.id || attachment?.response?.data?.id || attachment?.file?.id;
};

const carbonePrintSettingsSchema: ISchema = {
  type: 'object',
  properties: {
    template: {
      type: 'array',
      title: tStr('Template'),
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Upload.Attachment',
      'x-component-props': {
        action: 'attachments:create',
        accept: '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        maxCount: 1,
        multiple: false,
      },
    },
    outputFormat: {
      type: 'string',
      title: tStr('Output format'),
      required: true,
      default: 'pdf',
      enum: [
        { label: 'pdf', value: 'pdf' },
        { label: 'docx', value: 'docx' },
      ],
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': {
        allowClear: false,
      },
    },
    appends: {
      type: 'array',
      title: tStr('Relations'),
      'x-decorator': 'FormItem',
      'x-component': 'ArrayItems',
      items: {
        type: 'object',
        properties: {
          space: {
            type: 'void',
            'x-component': 'Space',
            properties: {
              name: {
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                'x-component-props': {
                  placeholder: tStr('Relation field name'),
                },
              },
              filter: {
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                'x-component-props': {
                  placeholder: tStr('Optional filtrex filter'),
                },
              },
              remove: {
                type: 'void',
                'x-decorator': 'FormItem',
                'x-component': 'ArrayItems.Remove',
              },
            },
          },
        },
      },
      properties: {
        add: {
          type: 'void',
          title: tStr('Add relation'),
          'x-component': 'ArrayItems.Addition',
        },
      },
    },
  },
};

export const carbonePrintActionSettings = new SchemaSettings({
  name: 'actionSettings:carbonePrint',
  items: [
    {
      name: 'editButton',
      Component: ButtonEditor,
      useComponentProps() {
        const { buttonEditorProps } = useSchemaToolbar();
        return buttonEditorProps;
      },
    },
    {
      name: 'linkageRules',
      Component: SchemaSettingsLinkageRules,
      useComponentProps() {
        const { linkageRulesProps } = useSchemaToolbar();
        return linkageRulesProps;
      },
    },
    {
      name: 'carbonePrintSettings',
      type: 'actionModal',
      useComponentProps() {
        const fieldSchema = useFieldSchema();
        const { dn } = useDesignable();
        const { t } = useTranslation(NAMESPACE);

        return {
          title: t('Carbone print settings'),
          schema: carbonePrintSettingsSchema,
          components: { ArrayItems },
          initialValues: {
            outputFormat: 'pdf',
            appends: [],
            ...(fieldSchema?.['x-action-settings'] || {}),
          },
          onSubmit: (values: any) => {
            const template = Array.isArray(values.template) ? values.template.slice(0, 1) : values.template;
            const templateId = getAttachmentId(template);

            fieldSchema['x-action-settings'] = {
              ...(fieldSchema?.['x-action-settings'] || {}),
              ...values,
              template,
              templateId,
            };

            dn.emit('patch', {
              schema: {
                'x-uid': fieldSchema['x-uid'],
                'x-action-settings': fieldSchema['x-action-settings'],
              },
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'divider',
      type: 'divider',
    },
    {
      name: 'delete',
      type: 'remove',
      useComponentProps() {
        const { t } = useTranslation();

        return {
          removeParentsIfNoChildren: true,
          breakRemoveOn: (schema) => schema['x-component'] === 'Space' || schema['x-component'].endsWith('ActionBar'),
          confirm: {
            title: t('Delete action'),
          },
        };
      },
    },
  ],
});
