import { omit } from "ramda";
import commandParser from "../commandParser";
import eventTypes from "../eventTypes";

const getFormattedConfig = (config) => {
  const sanitizedConfig = omit(
    ["apiToken", "signingSecret", "appToken", "botToken"],
    config
  );
  return JSON.stringify(sanitizedConfig, null, 4);
};

export default (config, emitter, log) => {
  const processMessage = async (message) => {
    const command = commandParser(message.text);
    if (command === null) {
      return;
    }
    let response = null;
    switch (command.command) {
      case "info":
        response = `Mi dueño es <@${config.owner}>`;
        break;
      case "shutdown":
        log("apagando");
        emitter.emit("send:message", "adios", message.channel);
        process.exit();
        break;
      case "config":
        emitter.emit(
          eventTypes.OUT.sendMessage,
          "```" + getFormattedConfig(config) + "```",
          message.channel
        );
    }

    if (response !== null) {
      emitter.emit("send:message", response, message.channel);
    }
  };

  emitter.on("received:message", processMessage);
};
