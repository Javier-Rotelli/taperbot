/** @type { import("./plugin").TaperbotPlugin } */
export default ({ config, emitter, log }) => {
  emitter.on("reaction:added", (payload) => {
    if (
      payload.item.type === "message" &&
      payload.item.channel === config.channel &&
      payload.item_user === config.cook
    ) {
      const messageTime = new Date(payload.item.ts * 1000);
      messageTime.setHours(0, 0, 0, 0);

      const reactionTime = new Date(payload.ts * 1000);
      reactionTime.setHours(0, 0, 0, 0);

      log({ messageTime, reactionTime });

      if (reactionTime > messageTime) {
        const text = `<@${payload.user}> \r\n https://media.giphy.com/media/26uf3DbP1a8nwAw6c/giphy.gif`;
        emitter.emit("send:message", text, payload.item.channel);
      }
    }
  });
};
