import commandParser from "./../commandParser";

const queue = [];
const playersRegex = /(?=<@)[^>]*(?=>)/gi;

const getPlayers = (text) => text.match(playersRegex).map((m) => m.substr(2));

function pushMatch(text) {
  queue.unshift(getPlayers(text));
  return "Añadidos!";
}

function popMatch(text) {
  const players = `<@${queue.pop().join("> - <@")}>`;
  return `juegan: ${players}`;
}
const showMatches = (text) =>
  queue.map((match, index) => `${index} <@${match.join("> - <@")}>`).join("\n");

/** @type { import("./plugin").TaperbotPlugin } */
export default ({ config, emitter }) => {
  emitter.on("received:message", (message) => {
    const command = commandParser(message.text);
    if (command === null) {
      return;
    }
    let response = null;
    switch (command.command) {
      case "anotame":
        response = pushMatch(command.text);
        break;
      case "termino":
        response = popMatch(command.text);
        break;
      case "lista":
        response = showMatches(command.text);
        break;
    }

    if (response !== null) {
      emitter.emit("send:message", response, message.channel);
    }
  });
};
