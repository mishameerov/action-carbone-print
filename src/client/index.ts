export * from './CarbonePrintActionInitializer';
export * from './CarbonePrintPluginProvider';
export * from './useCarbonePrintAction';

import { Plugin, useActionAvailable } from '@nocobase/client';
import { CarbonePrintPluginProvider } from './CarbonePrintPluginProvider';
import { carbonePrintActionSettings } from './schemaSettings';

export class PluginActionCarbonePrintClient extends Plugin {
  async load() {
    this.app.use(CarbonePrintPluginProvider);
    this.app.schemaSettingsManager.add(carbonePrintActionSettings);

    const initializerData = {
      title: '{{t("Carbone print", { ns: "action-carbone-print" })}}',
      Component: 'CarbonePrintActionInitializer',
      schema: {
        'x-decorator': 'ACLActionProvider',
        'x-acl-action-props': {
          skipScopeCheck: true,
        },
      },
      useVisible: () => useActionAvailable('carbonePrint'),
    };

    this.app.schemaInitializerManager.addItem(
      'details:configureActions',
      'enableActions.carbonePrint',
      initializerData,
    );
  }
}

export default PluginActionCarbonePrintClient;
