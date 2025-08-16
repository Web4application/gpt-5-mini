// src/gpt5.js
import express from "express";
import OpenAI from "openai";

const router = express.Router();
const client = new OpenAI({
  apiKey: process.env.sk-AIzaSyAvrxOyAVzPVcnzxuD0mjKVDyS2bNWfC10

});

// POST /api/gpt5
router.post("/api/gpt-5-mini", async (req, res) => {
  try {
    const { prompt, max_tokens = 800, temperature = 0.2, verbosity } = req.body;

    // Use Responses API for GPT-5
    const response = await client.responses.create({
      model: "gpt-5-mini",            // or "gpt-5-mini" for cheaper/faster
      input: prompt,
      // GPT-5-specific params like verbosity are supported per new docs
      // include them conditionally:
      ...(verbosity ? { verbosity } : {}),
      max_output_tokens: max_tokens,
      temperature
    });

    // the structure may include response.output[0].content[0].text depending on the client version
    res.json(response);
  } catch (err) {
    console.error("GPT5 error:", err);
    res.status(500).json({ error: err.message || err });
  }
});

export default router;
