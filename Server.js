import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

const raw = fs.readFileSync(path.join(__dirname, "metadata.csv"), "utf-8");
const lines = raw.split("\n").filter(Boolean);

const assets = lines.map(line => {
  const [file, size] = line.split(",");
  return {
    file: file.trim(),
    size: parseInt(size.trim(), 10),
    type: getType(file),
  };
});

function getType(file: string) {
  if (file.endsWith(".js")) return "JavaScript";
  if (file.endsWith(".css")) return "CSS";
  if (file.endsWith(".png") || file.endsWith(".woff") || file.endsWith(".ttf")) return "Media";
  if (file.startsWith("/api/")) return "API";
  if (file.endsWith(".json") || file.endsWith(".txt")) return "Config";
  return "Other";
}

fs.writeFileSync("assets.json", JSON.stringify(assets, null, 2));
console.log("✅ Parsed metadata into assets.json");

dotenv.config();
const app = express();
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// SSE GET endpoint
app.get("/api/chat", async (req, res) => {
  try {
    const message = req.query.message;

    if (!message || message.trim() === "") {
      return res.status(400).json({ error: "Message is required" });
    }

    // SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const stream = await openai.responses.stream({
      model: "gpt-5-mini",
      input: message,
      reasoning: { effort: "medium" },
      text: {
        format: { type: "text" },
        verbosity: "medium",
      },
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
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 SSE server running at http://localhost:${PORT}`);
});
