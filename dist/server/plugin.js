/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var plugin_exports = {};
__export(plugin_exports, {
  PluginActionCarbonePrintServer: () => PluginActionCarbonePrintServer,
  default: () => plugin_default
});
module.exports = __toCommonJS(plugin_exports);
var import_server = require("@nocobase/server");
var import_carbone_print = require("./actions/carbone-print");
class PluginActionCarbonePrintServer extends import_server.Plugin {
  logger;
  beforeLoad() {
    this.app.on("afterInstall", async () => {
      const rolesRepo = this.app.db.getRepository("roles");
      if (!rolesRepo) {
        return;
      }
      const roles = await rolesRepo.find({
        filter: {
          name: ["admin"]
        }
      });
      for (const role of roles) {
        const strategy = role.get("strategy") || {};
        const actions = /* @__PURE__ */ new Set([...strategy.actions || [], "carbonePrint"]);
        await rolesRepo.update({
          filter: {
            name: role.get("name")
          },
          values: {
            strategy: {
              ...strategy,
              actions: Array.from(actions)
            }
          }
        });
      }
    });
  }
  async load() {
    this.logger = this.createLogger({
      dirname: "action-carbone-print",
      filename: "%DATE%.log"
    });
    this.app.dataSourceManager.afterAddDataSource((dataSource) => {
      dataSource.resourceManager.registerActionHandler("carbonePrint", import_carbone_print.carbonePrint.bind(this));
      dataSource.acl.setAvailableAction("carbonePrint", {
        displayName: '{{t("Carbone print")}}',
        allowConfigureFields: true,
        aliases: ["carbonePrint"]
      });
    });
  }
}
var plugin_default = PluginActionCarbonePrintServer;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PluginActionCarbonePrintServer
});
