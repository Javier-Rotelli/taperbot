import { create } from "apisauce";
import { take, forEach, propOr, compose, map, ifElse, lt, length } from "ramda";
import commandParser from "../commandParser";

/** @type { import("./plugin").TaperbotPlugin } */
export default ({ config, emitter, log }) => {
  // define the api
  const api = create({
    baseURL: "http://api.urbandictionary.com/v0/define",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  emitter.on("received:message", (message) => {
    const command = commandParser(message.text);
    if (command === null || command.command !== "define") {
      return;
    }

    api
      .get("", { term: command.text })
      .then((res) => {
        compose(
          forEach((answer) =>
            emitter.emit("send:message", answer, message.channel)
          ),
          ifElse(
            compose(lt(0), length),
            map((def) => `${def.definition} (${def.permalink})`),
            () => [
              "I'm sorry, my responses are limited. You must ask the right question. \r\n https://pics.me.me/m-sorry-my-responses-are-limited-you-must-ask-the-right-32270832.png",
            ]
          ),
          take(2),
          propOr([], "list")
        )(res.data);
      })
      .catch((err) => {
        throw err;
      });
  });
};
