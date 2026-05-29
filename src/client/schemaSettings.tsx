import { ArrayItems } from '@formily/antd-v5';
import { ISchema, useFieldSchema } from '@formily/react';
import {
  ButtonEditor,
  SchemaSettings,
  SchemaSettingsLinkageRules,
  useDesignable,
  useSchemaToolbar,
} from '@nocobase/client';
import { Typography } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { NAMESPACE, tStr } from './locale';
import { TemplateAddButton } from './TemplateAddButton';
import { TemplateLibraryManager } from './TemplateLibraryManager';

const SectionTitle: React.FC<{ title?: string; withTopGap?: boolean }> = ({ title, withTopGap }) => (
  <Typography.Title level={4} style={{ marginTop: withTopGap ? 24 : 8, marginBottom: 8 }}>
    {title}
  </Typography.Title>
);

const SubsectionTitle: React.FC<{ title?: string; withTopGap?: boolean }> = ({ title, withTopGap }) => (
  <Typography.Title level={5} style={{ marginTop: withTopGap ? 24 : 8, marginBottom: 8 }}>
    {title}
  </Typography.Title>
);

const getAttachmentId = (value: any) => {
  const attachment = Array.isArray(value) ? value[0] : value;
  return attachment?.id || attachment?.data?.id || attachment?.response?.data?.id || attachment?.file?.id;
};

const carbonePrintSettingsSchema: ISchema = {
  type: 'object',
  properties: {
    templateSectionTitle: {
      type: 'void',
      'x-component': 'SectionTitle',
      'x-component-props': {
        title: tStr('Template'),
        withTopGap: false,
      },
    },
    templateLibrary: {
      type: 'void',
      'x-component': 'TemplateLibraryManager',
    },
    templateAddTitle: {
      type: 'void',
      'x-component': 'SubsectionTitle',
      'x-component-props': {
        title: tStr('Add'),
        withTopGap: true,
      },
    },
    templateDraftTitle: {
      type: 'string',
      title: tStr('Template name'),
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      'x-component-props': {
        placeholder: tStr('Enter template name'),
      },
    },
    template: {
      type: 'array',
      title: tStr('Template'),
      'x-decorator': 'FormItem',
      'x-component': 'Upload.Attachment',
      'x-component-props': {
        action: 'attachments:create',
        accept: '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        maxCount: 1,
        multiple: false,
      },
    },
    templateAddAction: {
      type: 'void',
      'x-decorator': 'FormItem',
      'x-component': 'TemplateAddButton',
    },
    templateRefId: {
      type: 'number',
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      'x-hidden': true,
    },
    templateLibraryRefreshKey: {
      type: 'void',
      'x-hidden': true,
    },
    resultSectionTitle: {
      type: 'void',
      'x-component': 'SectionTitle',
      'x-component-props': {
        title: tStr('Result'),
        withTopGap: true,
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
    responseType: {
      type: 'string',
      title: tStr('Response behavior'),
      required: true,
      default: 'download',
      enum: [
        { label: tStr('Download file'), value: 'download' },
        { label: tStr('Open in browser'), value: 'inline' },
      ],
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': {
        allowClear: false,
      },
    },
    relationsSectionTitle: {
      type: 'void',
      'x-component': 'SectionTitle',
      'x-component-props': {
        title: tStr('Relations'),
        withTopGap: true,
      },
    },
    appends: {
      type: 'array',
      title: tStr('Related fields'),
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
          components: { ArrayItems, TemplateLibraryManager, TemplateAddButton, SectionTitle, SubsectionTitle },
          initialValues: {
            outputFormat: 'pdf',
            responseType: 'download',
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
