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

export function getHistory(sessionId) {
  return history[sessionId] || [];
}

export function addMessage(sessionId, role, content) {
  if (!history[sessionId]) history[sessionId] = [];
  history[sessionId].push({ role, content });
  saveHistory(history);
}

export function resetHistory(sessionId) {
  history[sessionId] = [];
  saveHistory(history);
}
