import commandParser from "../commandParser";
import { Configuration, OpenAIApi } from "openai";

/**
 * Taperbot plugin to anwser technical questions using GPT3 from OpenAI.
 *
 * Setup: set OPENAI_API_KEY env variable. Create api key here https://platform.openai.com/account/api-keys
 * Usage from Slack: @taperbot /aiudame how do I set a public folder for an express server
 * Test it from terminal: npm run cli /aiudame how do I set a public folder for an express server
 **/
export default ({ config, emitter, log }) => {
  const openai = new OpenAIApi(
    new Configuration({
      apiKey: config.apiKey,
    })
  );

  emitter.on("received:message", (message) => {
    const command = commandParser(message.text);
    if (command === null || command.command !== "aiudame") {
      return;
    }

    const prompt = message.text.substr(
      message.text.indexOf("/aiudame ") + "/aiudame ".length
    );

    openai
      .createCompletion({
        model: "text-davinci-003",
        prompt: `Assume that I am a software engineer asking you this technical question:
${prompt + (prompt.endsWith(".") ? "" : ".")}
Provide a code example if needed.
`,
        max_tokens: 175,
      })
      .then((_) => {
        // console.log(_.data.choices[0].text.trim());
        emitter.emit(
          "send:message",
          _.data.choices[0].text.trim(),
          message.channel
        );
      })
      .catch((_) => {
        throw _;
      });
  });
};
