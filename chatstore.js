import fs from "fs";
import path from "path";

const HISTORY_FILE = path.join(process.cwd(), "chatHistory.json");

// Load history from disk
function loadHistory() {
  if (fs.existsSync(HISTORY_FILE)) {
    return JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8"));
  }
  return {};
}

// Save history to disk
function saveHistory(history) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

let history = loadHistory();

// --- Inject default base prompts for GPT-5-mini ---
function injectBasePrompt(sessionId) {
  if (!history[sessionId] || history[sessionId].length === 0) {
    history[sessionId] = [
      {
        role: "system",
        content:
          "You are GPT-5-mini, a forward-thinking, reasoning-oriented assistant. " +
          "You explain ideas clearly, adapt tone to context, and stay consistent."
      },
      {
        role: "developer",
        content: `
Configuration:
- Model: gpt-5-mini
- Text format: text
- Reasoning effort: medium
- Verbosity: medium
- Store: true

Guidelines:
1. Be conversational but practical.
2. Explain reasoning when useful.
3. Use examples when teaching.
4. Keep answers consistent with chat history.
        `.trim()
      }
    ];
    saveHistory(history);
  }
}

export function getHistory(sessionId) {
  injectBasePrompt(sessionId); // ensure base prompt is always there
  return history[sessionId];
}

export function addMessage(sessionId, role, content) {
  injectBasePrompt(sessionId);
  history[sessionId].push({ role, content });
  saveHistory(history);
}

export function resetHistory(sessionId) {
  history[sessionId] = [];
  injectBasePrompt(sessionId); // re-add base prompt after reset
  saveHistory(history);
}
