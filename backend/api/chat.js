# OpenAI chat route
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message } = req.body;

  try {
    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: message
    });

    res.status(200).json({ reply: response.output_text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
