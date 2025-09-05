import express from "express";
import OpenAI from "openai";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// SSE GET endpoint
app.get("/api/chat", async (req, res) => {
  try {
    const message = req.query.message;
    if (!message || message.trim() === "") {
      return res.status(400).json({ error: "Message is required" });
    }
    app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
  if (!message || message.trim() === "") {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        { role: "system", content: "You are a helpful, concise AI assistant." },
        { role: "user", content: message }
      ],
      max_tokens: 400
    });

    const reply = response.choices[0].message.content;
    res.status(200).json({ reply });
  } catch (err) {
    console.error("❌ POST error:", err);
    res.status(500).json({ error: "Something went wrong with POST request." });
  }
});

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const stream = await openai.responses.stream({
      model: "gpt-5-mini",
      input: message,
      reasoning: { effort: "medium" },
      text: {
        format: { type: "text" },
        verbosity: "medium",
      },
    });

    for await (const event of stream) {
      if (event.type === "response.output_text.delta") {
        res.write(`data: ${event.delta}\n\n`);
      } else if (event.type === "response.completed") {
        res.write("data: [END]\n\n");
        res.end();
      }
    }
  } catch (err) {
    console.error("❌ SSE error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Something went wrong with SSE." });
    } else {
      res.end();
    }
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 SSE server running at http://localhost:${PORT}`);
});
