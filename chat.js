import OpenAI from "openai";
import { tools, toolMap } from "./tools/index.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function chat(userMessage) {
  let response = await openai.responses.create({
    model: "gpt-5-mini",
    input: [{ role: "user", content: userMessage }],
    text: { format: { type: "text" }, verbosity: "medium" },
    reasoning: { effort: "medium" },
    tools,
    store: true
  });

  for (const output of response.output) {
    if (output.type === "message") {
      console.log("💬 GPT:", output.content[0].text);
    } else if (output.type === "tool_call") {
      const { name, arguments: args } = output;
      const result = await toolMap[name](args);

      console.log("🛠 Tool used:", name, "→", result);

      // feed result back into GPT
      const followUp = await openai.responses.create({
        model: "gpt-5-mini",
        input: [
          { role: "user", content: userMessage },
          { role: "assistant", content: [{ type: "tool_result", tool_name: name, result }] }
        ],
        text: { format: { type: "text" }, verbosity: "medium" },
        store: true
      });

      for (const out of followUp.output) {
        if (out.type === "message") {
          console.log("💬 GPT (final):", out.content[0].text);
        }
      }
    }
  }
}

// Test
await chat("What’s the weather in New York?");
await chat("Calculate 12 * 9");
await chat("Tell me a random fun fact.");
