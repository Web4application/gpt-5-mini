import { VercelRequest, VercelResponse } from "@vercel/node";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const message = req.query.message as string;

  if (!message || message.trim() === "") {
    return res.status(400).json({ error: "Message is required" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const stream = await openai.responses.stream({
      model: "gpt-5-mini",
      input: message,
      reasoning: { effort: "medium" },
      text: { format: { type: "text" }, verbosity: "medium" },
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
}
