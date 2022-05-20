import commandParser from "../commandParser";
import eventTypes from "../eventTypes";
import frames from "./animations/flip.json";
import waves from "./animations/waves.json";

export default (config, emitter, log) => {
  const animate = (ts, channel, [frame, ...tail]) => {
    emitter.emit(
      eventTypes.OUT.webPost,
      "chat.update",
      {
        channel: channel,
        text: frame,
        ts: ts,
      },
      (error) => {
        if (error !== null) {
          return log(error);
        }
        if (tail.length > 0) {
          setTimeout(() => {
            animate(ts, channel, tail);
          }, 1000);
        }
      }
    );
  };

  emitter.on(eventTypes.IN.receivedMessage, (message) => {
    const command = commandParser(message.text);
    if (
      command === null ||
      (command.command !== "flip" && command.command !== "ola")
    ) {
      return;
    }
    const [first, ...rest] = command.command == "flip" ? frames : waves;
    emitter.emit(
      eventTypes.OUT.webPost,
      "chat.postMessage",
      {
        channel: message.channel,
        text: first,
        as_user: true,
      },
      (err, response) => {
        log(err);
        setTimeout(() => {
          animate(response.ts, message.channel, rest);
        }, 1000);
      }
    );
  });
};
