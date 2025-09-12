import express from "express";
import { defaultAIConfig } from "../config/Ai.js";
import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post("/ask-stream", async (req, res) => {
  try {
    const { prompt } = req.body;

    // SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const completion = await openai.chat.completions.create({
      model: defaultAIConfig.model,
      messages: [
        { role: "system", content: defaultAIConfig.preamble },
        { role: "user", content: prompt }
      ],
      temperature: defaultAIConfig.temperature,
      max_tokens: defaultAIConfig.maxTokens,
      stream: true // <-- streaming enabled
    });

    for await (const chunk of completion) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        res.write(`data: ${JSON.stringify(content)}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.error(err);
    res.write(`data: ${JSON.stringify("⚠️ Error: " + err.message)}\n\n`);
    res.end();
  }
});

export default router;
