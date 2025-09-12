import express from "express";
import { getAIResponse } from "../services/aiService.js";

const router = express.Router();

router.post("/ask", async (req, res) => {
  try {
    const { prompt } = req.body;
    const aiResponse = await getAIResponse(prompt);
    res.json({ response: aiResponse });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "AI request failed" });
  }
});

export default router;
