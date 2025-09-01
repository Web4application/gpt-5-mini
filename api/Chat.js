import OpenAI from "openai";

// Use environment variable for your key
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "No message provided" });

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini", // or "gpt-5-mini" if available
      messages: [
        { role: "system", content: "You are a helpful, concise AI assistant." },
        { role: "user", content: message }
      ],
      max_tokens: 400
    });

    const reply = response.choices[0].message.content;
    res.status(200).json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: "⚠️ AI backend error" });
  }
}
