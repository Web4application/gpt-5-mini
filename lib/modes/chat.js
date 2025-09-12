import readline from "readline";
import chalk from "chalk";
import { askGPT } from "../GPT-5-mini.js";

export async function chatMode() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log(chalk.green("✨ GPT-5-mini Chat Mode ✨"));
  console.log("Type 'exit' to quit.\n");

  let history = [];

  async function askWithMemory(input) {
    history.push({ role: "user", content: input });
    const response = await askGPT(history, "friendly");
    history.push({ role: "assistant", content: response });
    return response;
  }

  rl.setPrompt("> ");
  rl.prompt();

  rl.on("line", async (input) => {
    if (input.toLowerCase() === "exit") {
      console.log(chalk.yellow("👋 Goodbye!"));
      rl.close();
      return;
    }

    const reply = await askWithMemory(input);
    console.log(chalk.cyan(reply));
    rl.prompt();
  });
}
