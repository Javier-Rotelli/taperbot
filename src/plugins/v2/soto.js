import fs from "fs/promises";
import { directMention } from "@slack/bolt";
import dayjs from "dayjs";
import "dayjs/locale/es";
import "dayjs/plugin/relativeTime";
import commandParser from "../../commandParser";

const sotoFile = "data/soto.json";
let lastSotos = [];
export default async ({ app, log }) => {
  try {
    lastSotos = JSON.parse(await fs.readFile(sotoFile));
  } catch (error) {
    log("Error cargando el archivo de last sotos");
  }

  app.message(directMention(), "soto?", async ({ message, say }) => {
    log(message);
    const { text } = commandParser(message.text);
    const lastSoto = lastSotos[lastSotos.length];
    lastSotos.push({ date: dayjs().format(), text });
    fs.writeFile(sotoFile, JSON.stringify(lastSotos));
    if (lastSoto) {
      await say(`Days since last Soto: ~${lastSoto.date}~ 0`);
    }
  });

  return {
    commands: [
      {
        command: "/soto",
        description: "Days since last soto",
        action: async ({ ack, respond }) => {
          log("SOTO");
          // Acknowledge command request
          await ack();

          await respond(`Soto!`);
        },
      },
    ],
    help: "le decis que viste a un soto y registra la cantidad de dias desde el ultimo avistaje de un soto",
    homePage: () => ({
      type: "section",
      text: {
        type: "mrkdwn",
        text: lastSotos
          .map((soto) => `- ${dayjs(soto.date).fromNow()}: ${soto.text}`)
          .join("\n"),
      },
    }),
  };
};
