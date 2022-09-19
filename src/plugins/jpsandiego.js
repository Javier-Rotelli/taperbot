import commandParser from "../commandParser";
import eventTypes from "../eventTypes";

let where = "";

/** @type { import("./plugin").TaperbotPlugin } */
export default ({ config, emitter, log }) => {
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
