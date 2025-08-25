import express from "express";
import OpenAI from "openai";

const router = express.Router();
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post("/", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "No message provided" });

    const response = await client.responses.create({
      model: "gpt-5",
      prompt: {
        id: "pmpt_68abe94a01508196a60556bd525932ca0cb4300eb98ca011",
        version: "1",
        inputs: [{ name: "user_input", text: message }]
      }
    });

    // Extract the AI response text
    const reply = response.output_text || "⚠️ No response received.";
    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error connecting to OpenAI API" });
  }
});

export default router;
