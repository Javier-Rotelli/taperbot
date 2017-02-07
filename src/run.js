import WebSocket from 'ws'
import request from "request";
const EventEmitter = require('events').EventEmitter;

import {getConfig} from './config'

const conf = getConfig();

const isMessage = (mess) => mess.type === 'message';
const isFromUser = (mess, uid) => mess.user === uid;
const mentionsUser = (mess, uid) => mess.text.includes(`<@${uid}>`);
const isFromChannels = (mess, channels) => channels.includes(mess.channel);

export const shouldProcess = (message, userId, ignoredChannels) => !isFromChannels(message, ignoredChannels)
                                                                   && isMessage(message)
                                                                   && !isFromUser(message, userId)
                                                                   && mentionsUser(message, userId);

const startServer = (url) => {
  const ws = new WebSocket(url);
  const emitter = new EventEmitter();

  ws.on('open', () => {
    console.log('Connected');
  });

  ws.on('error', () => {
    console.log('Error on Websocket server');
  });

  ws.on('message', (raw_message) => {
    const message = JSON.parse(raw_message);
    if (shouldProcess(message, conf.userId, conf.ignoredChannels)){
      emitter.emit('received:message', message);
    }
  });

  emitter.on('send:message', (content, channel) => {
    if (conf.ignoredChannels.includes(channel)) {
      return;
    }
    console.log('procesando!');
    ws.send(JSON.stringify({
      channel: channel,
      id: 1,
      text: content,
      type: "message"
    }));
  });

  initPlugins(conf.plugins, emitter);
};

const initPlugins = (plugins, emitter) => {
  const pluginsFolder = './plugins/';

  return Object.keys(plugins).map((pluginName) => {
    const pluginConfig = plugins[pluginName];
    return require(`${pluginsFolder}${pluginName}`).default(pluginConfig, emitter);
  });
};

const getUrl = (apiToken) => "https://slack.com/api/rtm.start?token=" + apiToken;

request(getUrl(conf.apiToken), function (err, response, body) {
  if (!err && response.statusCode === 200) {
    var res = JSON.parse(body);
    if (res.ok) {
      startServer(res.url);
    } else {
      console.error(body);
    }
  }
});

