import OpenAI from "openai";
import { defaultAIConfig } from "../config/Ai.js";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function getAIResponse(prompt) {
  const response = await openai.chat.completions.create({
    model: defaultAIConfig.model,
    messages: [
      { role: "system", content: defaultAIConfig.preamble },
      { role: "user", content: prompt }
    ],
    temperature: defaultAIConfig.temperature,
    max_tokens: defaultAIConfig.maxTokens,
    tools: defaultAIConfig.tools,
    response_format: defaultAIConfig.output.type
  });

  return response.choices[0].message.content;
}
