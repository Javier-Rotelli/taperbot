import { keys } from "ramda";
import eventTypes from "../eventTypes";

const forwardTemplate = (channel, user, text) =>
  `${channel} -> ${user}:
    ${text}
`;

export default (config, emitter, log) => {
  emitter.on(eventTypes.IN.receivedOtherMessage, (message) => {
    if (!keys(config.channels).includes(message.channel)) {
      return;
    }

    emitter.emit(
      eventTypes.OUT.sendMessage,
      forwardTemplate(
        config.channels[message.channel],
        `<@${message.user}>`,
        message.text
      ),
      config.platea
    );
  });
};
