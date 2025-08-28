import express from "express";
import OpenAI from "openai";

const router = express.Router();
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Standard POST endpoint
router.post("/api/gpt5-mini", async (req, res) => {
  try {
    const { prompt, max_tokens = 800, temperature = 0.2, verbosity } = req.body;
    const response = await client.responses.create({
      model: "gpt-5-mini",
      input: prompt,
      ...(verbosity ? { verbosity } : {}),
      max_output_tokens: max_tokens,
      temperature
    });
    const text = response.output?.[0]?.content?.[0]?.text ?? "";
    res.json({ reply: text });
  } catch (err) {
    console.error("GPT‑5 Mini error:", err.response?.data || err.message);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Streaming SSE endpoint
router.get("/api/chat/stream", async (req, res) => {
  const message = req.query.message;
  if (!message) {
    res.status(400).end();
    return;
  }
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive"
  });
  try {
    const stream = await client.responses.stream({
      model: "gpt-5-mini",
      input: message,
      max_output_tokens: 800,
      temperature: 0.2
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
    console.error("SSE error:", err.message);
    res.end();
  }
});

export default router;
