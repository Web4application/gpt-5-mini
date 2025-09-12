import { Command } from "commander";
import chalk from "chalk";
import dotenv from "dotenv";
import fs from "fs";
import fetch from "node-fetch";
import { highlight } from "cli-highlight";
import { chatMode } from "./modes/chat.js";
import { askGPT } from "./GPT-5-mini.js";

dotenv.config();

const program = new Command();
const API_URL = process.env.RUNNER_URL || "http://localhost:5000/run";

// --- Run Code ---
async function runCode(language, code) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ language, code }),
  });
  const data = await res.json();
  return data.success ? data.output : `Error:\n${data.error}`;
}

// --- CLI Commands ---
program
  .name("gpt5-mini")
  .description("CLI for GPT-5-mini with chat + code runner")
  .version("1.1.0");

program
  .command("chat")
  .description("Start interactive GPT-5-mini chat")
  .action(() => {
    chatMode();
  });

program
  .command("run <file>")
  .description("Run a code file through the backend runner")
  .action(async (file) => {
    if (!fs.existsSync(file)) {
      console.error(chalk.red(`File not found: ${file}`));
      process.exit(1);
    }

    const ext = file.split(".").pop();
    const language = ext === "py" ? "python" : ext === "js" ? "javascript" : ext;

    const code = fs.readFileSync(file, "utf8");
    console.log(chalk.gray("=== Your Code ==="));
    console.log(highlight(code, { language, ignoreIllegals: true }));

    const output = await runCode(language, code);
    console.log(chalk.blue("\n=== Output ==="));
    console.log(output);
  });

program
  .command("explain <file>")
  .description("Run + explain a code file with GPT-5-mini")
  .action(async (file) => {
    if (!fs.existsSync(file)) {
      console.error(chalk.red(`File not found: ${file}`));
      process.exit(1);
    }

    const ext = file.split(".").pop();
    const language = ext === "py" ? "python" : ext === "js" ? "javascript" : ext;

    const code = fs.readFileSync(file, "utf8");
    const output = await runCode(language, code);

    console.log(chalk.gray("=== Your Code ==="));
    console.log(highlight(code, { language, ignoreIllegals: true }));

    console.log(chalk.blue("\n=== Output ==="));
    console.log(output);

    const explanation = await askGPT(
      `Explain this ${language} code:\n${code}\nOutput:\n${output}`,
      "coderunner"
    );
    console.log(chalk.magenta("\n=== Explanation ==="));
    console.log(explanation);
  });

program.parse(process.argv);
