const path = require('path');
import { getConfig } from './src/config';
import eventTypes from './src/eventTypes'
import createDebug from 'debug';
import adminPlugin from './src/plugins/admin';

import {EventEmitter} from 'events';
const emitter = new EventEmitter()

const conf = getConfig();

process.env.DEBUG = '*';

/** get arguments from command line */
let argsText = '';
let space = '';
for (let c = 2; c < process.argv.length; c++) {
  argsText += space + process.argv[c];
  space = ' ';
}

const initPlugins = (plugins, emitter) => {
  const pluginsFolder = './src/plugins/'

  return Object.keys(plugins).map((pluginName) => {
    const pluginConfig = plugins[pluginName]
    return require(`${pluginsFolder}${pluginName}`).default(pluginConfig, emitter, createDebug(`taperbot:${pluginName}`))
  }).concat([adminPlugin(conf, emitter, createDebug('taperbot:admin'))])
}

initPlugins(conf.plugins, emitter);

emitter.emit(eventTypes.IN.receivedMessage, {
  type: 'message',
  text: '<@u3FTH76RZ> ' + argsText,
})
