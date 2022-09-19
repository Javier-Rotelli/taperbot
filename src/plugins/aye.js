import commandParser from "../commandParser";

/** @type { import("./plugin").TaperbotPlugin } */
export default ({ config, emitter, log }) => {
  emitter.on("received:message", (message) => {
    const command = commandParser(message.text);
    log(command);
    if (command === null || command.command !== "ayeyapario") {
      return;
    }

    emitter.emit("send:message", config.pario, message.channel);
  });
};
