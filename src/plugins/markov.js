import fs from "fs";
import { prop } from "ramda";
import MarkovChain from "./markov/chain";
import eventTypes from "../eventTypes";
import { userToString } from "../slackUtils";
import commandParser from "../commandParser";

const chainFile = "data/markov.json";

let i = 0;
const debouncedSave = (data) => {
  i++;
  if (i > 10) {
    i = 0;
    fs.writeFileSync(chainFile, JSON.stringify(data), "utf8");
  }
};

/** @type { import("./plugin").TaperbotPlugin } */
export default ({ config, emitter, log }) => {
  const chain = new MarkovChain("");

  if (fs.existsSync(chainFile)) {
    const loadedBank = JSON.parse(fs.readFileSync(chainFile, "utf8"));
    chain.wordBank = loadedBank;
  }

  emitter.on(eventTypes.IN.receivedOtherMessage, (payload) => {
    const message =
      payload.text !== undefined ? payload : prop("message", payload);
    // const user = payload.text !== undefined ? payload.text : path(['message', 'text'], payload)
    if (message !== undefined) {
      chain.parse(`${userToString(message.user)}: ${message.text}`);
      debouncedSave(chain.wordBank);
    }
  });

  emitter.on(eventTypes.IN.receivedMessage, (message) => {
    const command = commandParser(message.text);
    if (command === null || command.command !== "dameUnaFrase") {
      return;
    }

    emitter.emit(
      "send:message",
      chain.end(Math.random() * 50).process(),
      message.channel
    );
  });
};
