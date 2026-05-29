import { Logger, LoggerOptions } from '@nocobase/logger';
import { Plugin } from '@nocobase/server';
import { resolve } from 'path';
import { carbonePrint } from './actions/carbone-print';

export class PluginActionCarbonePrintServer extends Plugin {
  logger: Logger;

  beforeLoad() {
    this.app.on('afterInstall', async () => {
      const rolesRepo = this.app.db.getRepository('roles');
      if (!rolesRepo) {
        return;
      }

      const roles = await rolesRepo.find({
        filter: {
          name: ['admin'],
        },
      });

      for (const role of roles) {
        const strategy = role.get('strategy') || {};
        const actions = new Set([...(strategy.actions || []), 'carbonePrint']);
        await rolesRepo.update({
          filter: {
            name: role.get('name'),
          },
          values: {
            strategy: {
              ...strategy,
              actions: Array.from(actions),
            },
          },
        });
      }
    });
  }

  async load() {
    this.logger = this.createLogger({
      dirname: 'action-carbone-print',
      filename: '%DATE%.log',
    } as LoggerOptions);

    await this.importCollections(resolve(__dirname, 'collections'));

    this.app.dataSourceManager.afterAddDataSource((dataSource) => {
      dataSource.resourceManager.registerActionHandler('carbonePrint', carbonePrint.bind(this));
      dataSource.acl.setAvailableAction('carbonePrint', {
        displayName: '{{t("Carbone print")}}',
        allowConfigureFields: true,
        aliases: ['carbonePrint'],
      });
    });

    this.app.acl.allow('carbonePrintTemplates', ['list', 'get', 'create', 'update', 'destroy'], 'loggedIn');
  }
}

export default PluginActionCarbonePrintServer;
