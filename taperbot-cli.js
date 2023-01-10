const path = require("path");
import { getConfig } from "./src/config";
import eventTypes from "./src/eventTypes";
import createDebug from "debug";
import adminPlugin from "./src/plugins/admin";
import createStorage from "./src/modules/storage";

import { EventEmitter } from "events";
const emitter = new EventEmitter();

process.env.DEBUG = "*";

/** get arguments from command line */
let argsText = "";
let space = "";
for (let c = 2; c < process.argv.length; c++) {
  argsText += space + process.argv[c];
  space = " ";
}

const config = getConfig();
const pluginsFolder = "./src/plugins/";
Object.keys(config.plugins)
  .map((pluginName) => {
    const pluginConfig = config.plugins[pluginName];
    return [pluginName, require(`${pluginsFolder}${pluginName}`).default, pluginConfig];
  }).concat([["admin", adminPlugin, config]]).forEach(([pluginName, plugin, config]) => {
    const log = createDebug(`taperbot:${pluginName}`);
    plugin({
      config,
      emitter,
      log,
      storage: createStorage(pluginName, { log }),
    })
  });

emitter.emit(eventTypes.IN.receivedMessage, {
  type: "message",
  text: "<@u3FTH76RZ> " + argsText,
});
