import express from "express";
import OpenAI from "openai";
import rateLimit from "express-rate-limit";

const router = express.Router();
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 🔒 Rate Limiting
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: "Too many requests. Please try again later."
});
router.use("/api/gpt5-mini", limiter);

// 📊 Logging Middleware
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// ❤️ Health Check Endpoint
router.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

// 🧠 POST Endpoint with Model Selection + History
router.post("/api/gpt5-mini", async (req, res) => {
  try {
    const {
      model = "gpt-5-mini",
      prompt,
      max_tokens = 800,
      temperature = 0.2,
      verbosity,
      history = []
    } = req.body;

    const input = [...history, { role: "user", content: prompt }];

    const response = await client.responses.create({
      model,
      input,
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

// 📡 Enhanced SSE Streaming Endpoint
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
        const payload = {
          delta: event.delta,
          timestamp: Date.now()
        };
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
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
