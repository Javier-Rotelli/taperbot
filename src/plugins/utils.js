import commandParser from "../commandParser";
import { getChannels, getGroups, getUsers } from "../slackUtils";

export default (config, emitter, log) => {
  const processMessage = async (message) => {
    const command = commandParser(message.text);
    if (command === null) {
      return;
    }
    let response = null;
    switch (command.command) {
      case "users":
        log("listando usuarios");
        response = (await getUsers(emitter))
          .map((member) => `id: ${member.id}, name: ${member.name}`)
          .join("\n");
        break;
      case "channels":
        log("listando channels");
        try {
          response = (await getChannels(emitter))
            .map(
              (channel) =>
                `id: ${channel.id}, name: ${channel.name}, is_group: ${channel.is_group}`
            )
            .join("\n");
        } catch (err) {
          log(err);
        }
        break;
    }

    if (response !== null) {
      emitter.emit("send:message", response, message.channel);
    }
  };

  emitter.on("received:message", processMessage);
};
