/** @type { import("./plugin").TaperbotPlugin } */
export default ({ config, emitter, log }) => {
  emitter.on("received:message", (message) => {
    emitter.emit("send:message", message.text, message.channel);
  });
};
