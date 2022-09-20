import commandParser from "../commandParser";
import eventTypes from "../eventTypes";

/** @type { import("./plugin").TaperbotPlugin } */
export default ({ config, emitter, log }) => {
  const lockedChannels = new Set();
  emitter.on(eventTypes.IN.receivedMessage, (message) => {
    const command = commandParser(message.text);
    if (
      command === null ||
      (command.command !== "lock" && command.command !== "unlock")
    ) {
      return;
    }
    if (command.command === "lock") {
      lockedChannels.add(message.channel);
      emitter.emit(
        "send:message",
        "TODOS CON LAS MANOS ARRIBA, ESTE CHANNEL SE ENCUENTRA BLOQUEADO",
        message.channel
      );
    } else {
      lockedChannels.delete(message.channel);
    }
  });

  emitter.on(eventTypes.IN.memberLeftChannel, (payload) => {
    if (!lockedChannels.has(payload.channel)) {
      return;
    }
    emitter.emit(
      eventTypes.OUT.webPost,
      "channels.invite",
      {
        channel: payload.channel,
        user: payload.user,
      },
      (err) => {
        if (err) {
          log(err);
        }
      }
    );
  });
};
