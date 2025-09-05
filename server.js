import express from "express";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import fetch from "node-fetch";
import { config as loadEnv } from "dotenv";

loadEnv();

const app = express();
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || "0.0.0.0";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));
app.use(cors({ origin: true }));

// Simple rate limit
const limiter = rateLimit({
  windowMs: 30 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Serve static frontend
app.use(express.static("public"));

// ---------- Helpers ----------
function sanitizeMessage(s) {
  if (typeof s !== "string") return "";
  // Basic trimming + hard length cap
  const trimmed = s.trim();
  return trimmed.slice(0, 4000);
}

// Fake local streamer if no API key
async function* localFakeStream(prompt) {
  const reply = `Local demo (no API key set). Echoing: ${prompt}`;
  // stream a token-ish output
  const parts = reply.split(" ");
  for (const p of parts) {
    yield p + " ";
    await new Promise(r => setTimeout(r, 80));
  }
  // End marker for SSE
  yield "[END]";
}

// OpenAI streaming via Chat Completions (kept on because it’s stable and widely used)
async function* openAIStream(prompt) {
  const url = "https://api.openai.com/v1/chat/completions";
  const body = {
    model: OPENAI_MODEL,
    stream: true,
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: prompt }
    ]
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenAI error ${res.status}: ${text || "No body"}`);
  }

  // SSE stream from OpenAI (data: {...})
  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx;
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const chunk = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 2);

      // Each line may look like "data: {...}" or "data: [DONE]"
      if (!chunk.startsWith("data:")) continue;
      const data = chunk.slice(5).trim();

      if (data === "[DONE]") {
        yield "[END]";
        return;
      }

      try {
        const json = JSON.parse(data);
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) {
          yield delta;
        }
      } catch {
        // ignore parse issues
      }
    }
  }
  // In case upstream didn’t send [DONE]
  yield "[END]";
}

function streamFromProvider(message) {
  return OPENAI_API_KEY ? openAIStream(message) : localFakeStream(message);
}

// ---------- Routes ----------

// SSE streaming: /api/stream?message=...
app.get("/api/stream", async (req, res) => {
  const message = sanitizeMessage(req.query.message);
  if (!message) {
    return res.status(400).json({ error: "message query param required" });
  }

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  let closed = false;
  req.on("close", () => { closed = true; });

  try {
    for await (const chunk of streamFromProvider(message)) {
      if (closed) break;
      res.write(`data: ${chunk}\n\n`);
    }
  } catch (err) {
    if (!closed) {
      res.write(`data: [ERROR] ${String(err.message || err)}\n\n`);
    }
  } finally {
    if (!closed) res.end();
  }
});

// Non-streaming POST
app.post("/api/chat", async (req, res) => {
  const message = sanitizeMessage(req.body?.message);
  if (!message) {
    return res.status(400).json({ error: "message field required" });
  }

  if (!OPENAI_API_KEY) {
    // local fake reply
    return res.json({ reply: `Local demo (no API key). You said: ${message}` });
  }

  try {
    // Call OpenAI non-streaming
    const url = "https://api.openai.com/v1/chat/completions";
    const body = {
      model: OPENAI_MODEL,
      stream: false,
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: message }
      ]
    };

    const r = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    if (!r.ok) {
      const t = await r.text().catch(() => "");
      return res.status(502).json({ error: `OpenAI error ${r.status}: ${t}` });
    }
    const json = await r.json();
    const reply = json.choices?.[0]?.message?.content || "";
    return res.json({ reply });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
});

// Health
app.get("/healthz", (req, res) => res.json({ ok: true }));

app.listen(PORT, HOST, () => {
  console.log(`Server listening on http://${HOST}:${PORT}`);
  console.log(OPENAI_API_KEY ? "OpenAI mode: ENABLED" : "OpenAI mode: DISABLED (local demo)");
});
