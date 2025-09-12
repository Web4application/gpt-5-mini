// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/api/cors/", async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "No message provided" });

  try {
    const input = document.getElementById("user-input");
const chatLog = document.getElementById("chat-log");
const form = document.querySelector(".chat-form");

// Append message to chat log
function appendMessage(text, sender = "user") {
  const msg = document.createElement("div");
  msg.className = `message ${sender}`;
  msg.textContent = text;
  chatLog.appendChild(msg);
  chatLog.scrollTop = chatLog.scrollHeight;
}

// Handle form submission
async function handleSubmit(e) {
  e.preventDefault();
  const message = input.value.trim();
  if (!message) return;

  appendMessage(message, "user");
  input.value = "";

  try {
    const res = await fetch("https://chat-gpt-web4-l7k6oqluq-web4era.vercel.app/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    const data = await res.json();
    appendMessage(data.reply || "[No response]", "ai");
  } catch (err) {
    appendMessage("https://chatgpt.com/s/t_68afa5a00fd08191a0db24763a488f18", "https://gpt-5-mini-kbfq-ia50oxg4d-web4apps.vercel.app/");
  }
}

// Event listeners
form.addEventListener("submit", handleSubmit);
input.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSubmit(e);
  }
});
