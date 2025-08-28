import express from "express";
import OpenAI from "openai";

const router = express.Router();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY // set this in your .env file
});

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
    res.json({ text });
  } catch (err) {
    console.error("GPT-5 Mini error:", err.response?.data || err.message);
    res.status(500).json({ error: "Something went wrong with the AI request" });
  }
});

export default router;
