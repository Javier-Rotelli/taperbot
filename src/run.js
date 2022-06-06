const { App } = require("@slack/bolt");
import { EventEmitter } from "events";
import createDebug from "debug";

import { getConfig } from "./config";
import {
  getNextId,
  isFromChannels,
  shouldProcess,
  isFromUser,
} from "./messageUtil";

import { initPlugins } from "./plugins";
import eventTypes from "./eventTypes";
import { getFromAPI, postToAPI } from "./slackWeb";

const log = createDebug("taperbot:core");
const devLog = createDebug("taperbot:core:dev");

const config = getConfig();

log("initing with config:");
log(config);

const app = new App({
  token: config.botToken,
  signingSecret: config.signingSecret,
  socketMode: true,
  appToken: config.appToken,
});

const emitter = new EventEmitter();

app.message(async ({ message }) => {
  if (shouldProcess(message, config.userId)) {
    emitter.emit(eventTypes.IN.receivedMessage, message);
  } else if (!isFromUser(message, config.userId)) {
    emitter.emit(eventTypes.IN.receivedOtherMessage, message);
  }
});

app.event("reaction_added", async ({ event, logger }) => {
  try {
    emitter.emit(eventTypes.IN.reactionAdded, event);
  } catch (error) {
    logger.error(error);
  }
});

app.event("reaction_removed", async ({ event, logger }) => {
  try {
    emitter.emit(eventTypes.IN.reactionRemoved, event);
  } catch (error) {
    logger.error(error);
  }
});

initPlugins(config, emitter, app);

const startServer = async () => {
  await app.start(process.env.PORT || 3000);
  log("Connected");

  emitter.on(eventTypes.OUT.sendMessage, (content, channel, id) => {
    if (config.ignoredChannels.includes(channel)) {
      return;
    }
    sendMessage(channel, content, id);
  });

  emitter.on(eventTypes.OUT.webGet, getFromAPI(app, config, log));

  emitter.on(eventTypes.OUT.webPost, postToAPI(app, config, log));

  // TODO: migrar esto
  // emitter.on(eventTypes.OUT.startTyping, (message) => {
  //   sendMessage(ws, {
  //     channel: message.channel,
  //     id: getNextId(),
  //     type: "typing",
  //     reply_to: message.id,
  //   });
  // });
};

const sendMessage = (channel, content, id = getNextId()) => {
  const message = {
    token: config.botToken,
    channel: channel,
    id,
    text: content,
    type: "message",
  };
  if (process.env.NODE_ENV !== "production") {
    devLog("Message to send: %O", message);
    // return;
  }
  app.client.chat.postMessage(message);
};

startServer();
