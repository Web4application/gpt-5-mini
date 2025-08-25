#!/usr/bin/env node
import readline from "readline";
import { askGPT } from "./gpt5mini.js";
import fetch from "node-fetch";
import chalk from "chalk";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log(chalk.green("Welcome to GPT-5-mini CLI (Auto Mode)!"));
console.log("Paste code snippets or type normal text. Type 'exit' to quit.\n");

// --- Helper to run code via API ---
async function runCode(language, code) {
  const response = await fetch("http://localhost:5000/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ language, code }),
  });
  const data = await response.json();
  return data.success ? data.output : `Error:\n${data.error}`;
}

// --- Read multi-line input until empty line ---
function multiLineInput(promptText) {
  return new Promise((resolve) => {
    let lines = [];
    console.log(promptText);
    rl.prompt();
    rl.on("line", function onLine(line) {
      if (line === "") {
        rl.removeListener("line", onLine);
        resolve(lines.join("\n"));
      } else {
        lines.push(line);
      }
    });
  });
}

// --- Auto Mode Detection ---
function isCodeSnippet(input) {
  return /```[\s\S]*```/.test(input) || /\b(print|console\.log|function|def|for|while|return)\b/.test(input);
}

// --- Main CLI ---
async function main() {
  rl.setPrompt("> ");
  rl.prompt();

  rl.on("line", async (input) => {
    if (input.toLowerCase() === "exit") {
      console.log(chalk.yellow("Goodbye!"));
      rl.close();
      return;
    }

    if (isCodeSnippet(input)) {
      // CodeRunner: ask for language and code
      rl.question("Enter programming language: ", async (language) => {
        const code = await multiLineInput(
          "Paste your code snippet (end with empty line):"
        );

        const codeOutput = await runCode(language, code);
        console.log(chalk.blue("=== Code Output ==="));
        console.log(codeOutput);

        // GPT-5-mini explanation
        const explanationPrompt = `Explain the following ${language} code output:\n${code}\nOutput:\n${codeOutput}`;
        const explanation = await askGPT(explanationPrompt, "coderunner");
        console.log(chalk.magenta("=== Explanation ==="));
        console.log(explanation);

        rl.prompt();
      });
    } else {
      // Default to friendly mode for normal text
      try {
        const response = await askGPT(input, "friendly");
        console.log(chalk.cyan(response || "[No output]"));
      } catch (err) {
        console.error(chalk.red("Error:"), err.message);
      }
      rl.prompt();
    }
  });
}

main();
