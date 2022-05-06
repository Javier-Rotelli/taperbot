import commandParser from "../CommandParser";
import eventTypes from "../eventTypes";

let where = "";

export default (config, emitter, log) => {
  emitter.on(eventTypes.IN.receivedMessage, (message) => {
    log(message);
    const command = commandParser(message.text);
    if (command === null || command.command !== "whereisjp") {
      return;
    }
    if (message.user === "U02TUBDT6" && command.text !== "") {
      where = command.text;
    } else {
      emitter.emit("send:message", where, message.channel);
    }
  });
};
