import { useForm } from '@formily/react';
import { useAPIClient, useRequest } from '@nocobase/client';
import { Button, Space, Table, Tag } from 'antd';
import React from 'react';
import { useMemo } from 'react';
import { useCarbonePrintTranslation } from './locale';

const extractList = (response: any) => {
  return response?.data?.data || response?.data || [];
};

export const TemplateLibraryManager = () => {
  const form = useForm();
  const api = useAPIClient();
  const { t } = useCarbonePrintTranslation();
  const selectedId = form.values?.templateRefId;
  const refreshKey = form.values?.templateLibraryRefreshKey;

  const { data, loading, refreshAsync } = useRequest(
    async () => {
      const response = await api.resource('carbonePrintTemplates').list({
        appends: ['attachment'],
        sort: ['-updatedAt'],
        pageSize: 200,
      });
      return extractList(response);
    },
    { refreshDeps: [refreshKey] },
  );

  const items = data || [];

  const columns = useMemo(
    () => [
      {
        title: t('Name'),
        dataIndex: 'title',
        key: 'title',
      },
      {
        title: t('File'),
        dataIndex: ['attachment', 'filename'],
        key: 'filename',
        render: (_: any, record: any) => record?.attachment?.filename || '-',
      },
      {
        title: t('Status'),
        dataIndex: 'isActive',
        key: 'isActive',
        width: 120,
        render: (value: boolean) => (
          <Tag color={value === false ? 'default' : 'green'}>{value === false ? t('Disabled') : t('Active')}</Tag>
        ),
      },
      {
        title: t('Actions'),
        key: 'actions',
        width: 220,
        render: (_: any, record: any) => {
          const attachment = record?.attachment;
          return (
            <Space>
              <Button
                size="small"
                type={selectedId === record.id ? 'primary' : 'default'}
                onClick={() => {
                  form.setValues({
                    ...form.values,
                    templateRefId: record.id,
                    templateId: record.attachmentId || attachment?.id,
                  });
                }}
              >
                {selectedId === record.id ? t('Selected') : t('Select')}
              </Button>
              <Button
                size="small"
                disabled={!attachment?.url}
                onClick={() => {
                  if (!attachment?.url) {
                    return;
                  }
                  window.open(attachment.url, '_blank');
                }}
              >
                {t('Download')}
              </Button>
            </Space>
          );
        },
      },
    ],
    [form, selectedId, t],
  );

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={12}>
      <Table
        rowKey="id"
        size="small"
        loading={loading}
        columns={columns as any}
        dataSource={items}
        pagination={{ pageSize: 6, hideOnSinglePage: false }}
      />
      <Space>
        <Button onClick={() => refreshAsync()}>{t('Refresh')}</Button>
      </Space>
    </Space>
  );
};

export default TemplateLibraryManager;
