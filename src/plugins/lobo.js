import { keys } from "ramda";
import eventTypes from "../eventTypes";

const forwardTemplate = (channel, user, text) =>({
  text: `*${channel} ~ <@${user}>:*
> ${text.replace(/\n/g, "\n> ")}`
});

/** @type { import("./plugin").TaperbotPlugin } */
export default ({ config, emitter, log }) => {
  emitter.on(eventTypes.IN.receivedOtherMessage, (message) => {
    if (!keys(config.channels).includes(message.channel)) {
      return;
    }
    if (!message.text) {
      return;
    }
    emitter.emit(
      eventTypes.OUT.sendMessage,
      forwardTemplate(
        config.channels[message.channel],
        message.user,
        message.text
      ),
      config.platea
    );
  });
};
