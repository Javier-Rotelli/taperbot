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

  app.message(directMention(), "/soto", async ({ message, say }) => {
    const { text } = commandParser(message.text);
    lastSotos.push({ date: dayjs().format(), text });
    fs.writeFile(sotoFile, JSON.stringify(lastSotos));
    await say(`Days since last Soto: ~${lastSoto.date}~ 0`);
  });

  return {
    commands: [
      {
        command: "/soto",
        description: "devuelve lo que le mandes",
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
