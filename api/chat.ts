import { VercelRequest, VercelResponse } from "@vercel/node";
import OpenAI from "openai";
import dotenv from "dotenv";
import cors from "cors"; // For CORS handling
import rateLimit from "express-rate-limit"; // If using Express wrapper
import morgan from "morgan"; // Logging middleware

dotenv.config();

// --- Security: Ensure API key is present ---
if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY in environment variables");
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Optional: Rate limiter (if using Express)
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 requests per minute
  message: { error: "Too many requests, please try again later." },
});

// Optional: CORS middleware
const corsHandler = cors({
  origin: "*", // Adjust to your allowed origins
  methods: ["GET", "POST"],
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Apply CORS
  await new Promise((resolve) => corsHandler(req as any, res as any, resolve));

  // Apply rate limiting (if using Express, wrap handler)
  // await new Promise((resolve) => limiter(req as any, res as any, resolve));

  // Log request (basic)
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

  // Health check endpoint
  if (req.method === "GET" && req.query.health === "true") {
    return res.status(200).json({ status: "ok", timestamp: Date.now() });
  }

  // Validate input
  const message = req.query.message as string;
  if (!message || message.trim() === "") {
    return res.status(400).json({ error: "Message is required" });
  }

  // Optional: Allow dynamic model selection
  const model = (req.query.model as string) || "gpt-5-mini";
  const verbosity = (req.query.verbosity as string) || "medium";
  const reasoningEffort = (req.query.effort as string) || "medium";

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const stream = await openai.responses.stream({
      model,
      input: message,
      reasoning: { effort: reasoningEffort },
      text: { format: { type: "text" }, verbosity },
    });

    for await (const event of stream) {
      if (event.type === "response.output_text.delta") {
        res.write(`data: ${event.delta}\n\n`);
      } else if (event.type === "response.completed") {
        res.write("data: [END]\n\n");
        res.end();
      }
    }
  } catch (error: any) {
    console.error("Error in chat handler:", error);
    res.write(`data: [ERROR] ${error.message || "Unknown error"}\n\n`);
    res.end();
  }
}
