import { merge, uid } from '@formily/shared';
import { SchemaInitializerItem, useSchemaInitializer, useSchemaInitializerItem } from '@nocobase/client';
import React from 'react';

export const CarbonePrintActionInitializer: React.FC = () => {
  const itemConfig = useSchemaInitializerItem();
  const { insert } = useSchemaInitializer();

  const schema = {
    type: 'void',
    title: '{{ t("Carbone print", { ns: "action-carbone-print" }) }}',
    'x-uid': uid(),
    'x-action': 'carbonePrint',
    'x-action-settings': {
      template: [],
      outputFormat: 'pdf',
      appends: [],
    },
    'x-toolbar': 'ActionSchemaToolbar',
    'x-settings': 'actionSettings:carbonePrint',
    'x-decorator': 'ACLActionProvider',
    'x-acl-action': 'carbonePrint',
    'x-acl-action-props': {
      skipScopeCheck: true,
    },
    'x-component': 'Action',
    'x-use-component-props': 'useCarbonePrintAction',
    'x-component-props': {
      icon: 'PrinterOutlined',
    },
  };

  return (
    <SchemaInitializerItem
      {...itemConfig}
      onClick={() => {
        const s = merge(schema || {}, itemConfig.schema || {});
        itemConfig?.schemaInitialize?.(s);
        insert(s);
      }}
    />
  );
};
