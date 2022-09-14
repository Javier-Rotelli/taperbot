import createDebug from "debug";
import adminPlugin from "./admin";

export const initPlugins = async (config, emitter, app) => {
  const log = createDebug("taperbot:core:plugins");
  const pluginsFolder = "./";

  const plugins = Object.keys(config.plugins).map((pluginName) => {
    log(`Iniciando plugin ${pluginName}`);
    const pluginConfig = config.plugins[pluginName];
    try {
      // eslint-disable-next-line no-constant-condition
      if (!pluginConfig.v2) {
        //V1
        return require(`${pluginsFolder}${pluginName}`).default(
          pluginConfig,
          emitter,
          createDebug(`taperbot:${pluginName}`)
        );
      } else {
        // V2
        log(`${pluginName} esta en la nueva version 🚀`);
        const plugin = require(`${pluginsFolder}v2/${pluginName}`).default({
          app,
          config: pluginConfig,
          log: createDebug(`taperbot:${pluginName}`),
        });

        plugin.commands.forEach((cm) => {
          app.command(cm.command, cm.action);
        });
      }
    } catch (error) {
      log(`Error inicializando plugin ${pluginName}`);
    }
  });

  await Promise.all(plugins);

  return plugins.concat([
    adminPlugin(config, emitter, createDebug("taperbot:admin")),
  ]);
};
