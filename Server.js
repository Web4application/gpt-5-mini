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

// Serve static frontend (optional)
app.use(express.static(path.join(__dirname, "public")));

// OpenAI client setup
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// POST /api/chat – non-streaming fallback
app.post("/api/chat", async (req, res) => {
  const { message } = req.body || {};
  if (!message) return res.status(400).json({ error: "No message provided" });

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: message }],
    });
    res.json({ reply: response.choices[0].message.content });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stream – real-time streaming via SSE
app.get("/api/stream", async (req, res) => {
  const message = req.query.message || "";

  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.flushHeaders?.();

  try {
    const stream = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: message }],
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices?.[0]?.delta?.content;
      if (content) {
        res.write(`data: ${content}\n\n`);
      }
    }

    res.write("data: [END]\n\n");
    res.end();
  } catch (err) {
    console.error("Streaming error:", err);
    res.write(`data: ⚠️ Error: ${err.message}\n\n`);
    res.write("data: [END]\n\n");
    res.end();
  }

  req.on("close", () => res.end());
});

// Health check
app.get("/healthz", (req, res) => res.json({ ok: true }));

// Start server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
