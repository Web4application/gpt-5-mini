// server.js
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve static frontend
app.use(express.static(path.join(__dirname, "public")));

// OpenAI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// POST /api/chat - real AI replies
app.post("/api/chat", async (req, res) => {
  const { message } = req.body || {};
  if (!message) return res.status(400).json({ error: "No message provided" });

  try {
    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: message
    });
    res.json({ reply: response.output_text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Optional SSE streaming endpoint
app.get("/api/stream", (req, res) => {
  const message = req.query.message || "";
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.flushHeaders && res.flushHeaders();

  const chunks = ["Thinking", "...", ` Replying to: ${message}`];
  let i = 0;

  const interval = setInterval(() => {
    if (i < chunks.length) {
      res.write(`data: ${chunks[i]}\n\n`);
      i++;
      return;
    }
    res.write("data: [END]\n\n");
    clearInterval(interval);
    res.end();
  }, 400);

  req.on("close", () => clearInterval(interval));
});

// Health check
app.get("/healthz", (req, res) => res.json({ ok: true }));

app.listen(port, () => console.log(`Server listening on port ${port}`));
