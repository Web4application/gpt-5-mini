import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// Streaming endpoint
app.post("/chat", async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Missing message" });

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // or gpt-4o
        messages: [{ role: "user", content: message }],
        stream: true
      })
    });

    // Tell the browser we're streaming
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Pipe chunks through as they arrive
    response.body.on("data", (chunk) => {
      const payloads = chunk.toString().split("\n\n");
      for (const payload of payloads) {
        if (payload.includes("[DONE]")) {
          res.write("event: done\ndata: [DONE]\n\n");
          return;
        }
        if (payload.startsWith("data:")) {
          const data = JSON.parse(payload.replace("data: ", ""));
          const text = data.choices?.[0]?.delta?.content;
          if (text) {
            res.write(`data: ${text}\n\n`);
          }
        }
      }
    });

    response.body.on("end", () => {
      res.write("event: done\ndata: [DONE]\n\n");
      res.end();
    });

    response.body.on("error", (err) => {
      console.error("Streaming error:", err);
      res.end();
    });

  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Streaming server running on http://localhost:${PORT}`);
});
