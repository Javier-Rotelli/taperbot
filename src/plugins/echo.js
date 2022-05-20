export default (config, emitter) => {
  emitter.on("received:message", (message) => {
    emitter.emit("send:message", message.text, message.channel);
  });
};
