import { directMention } from "@slack/bolt";
export const help = "";

export const commands = [
  {
    command: "/echo",
    description: "devuelve lo que le mandes",
  },
];

export default ({ app, config, log }) => {
  app.message(directMention(), "/echo", async ({ message, say }) => {
    log(message);
    await say(`${message.text}`);
  });
};
