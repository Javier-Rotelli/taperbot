/* eslint-disable */
/* el linter se queja y con razon, esto no es una buena idea */
/** @type { import("./plugin").TaperbotPlugin } */
export default ({ config, emitter, log }) => {
  emitter.on("received:message", (message) => {
    if (!message.text.includes("code: ")) {
      return;
    }
    try {
      const code = message.text.match(/\`([^\`]*)\`/)[1];
      {
        const require = null;
        const process = null;
        const text = eval(code).toString();
        emitter.emit("send:message", text, message.channel);
      }
    } catch (ex) {
      emitter.emit("send:message", ex.message, message.channel);
    }
  });
};
