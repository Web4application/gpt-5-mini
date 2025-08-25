import express from "express";
import dotenv from "dotenv";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { openai, defaultAIConfig } from "./config/ai.js";
import { addMessage, getHistory } from "./chatStore.js";

dotenv.config();

const app = express();
app.use(express.json());

const server = createServer(app);
const wss = new WebSocketServer({ server });

// --- WebSocket Chat with persistence ---
wss.on("connection", (ws) => {
  console.log("🔗 WebSocket client connected");

  ws.on("message", async (msg) => {
    try {
      const data = JSON.parse(msg.toString());
      const { sessionId = "default", message, variables = {}, tools = [] } = data;

      if (!message) {
        ws.send(JSON.stringify({ error: "Message is required" }));
        return;
      }

      // Get persisted history or bootstrap
      let chatHistory = getHistory(sessionId);
      if (chatHistory.length === 0) {
        addMessage(sessionId, "system", "You are GPT-5-mini, a helpful assistant.");
        addMessage(sessionId, "developer", `Use verbosity=${defaultAIConfig.text.verbosity}, reasoning effort=${defaultAIConfig.reasoning.effort}`);
      }

      // Add user message
      addMessage(sessionId, "user", message);
      if (Object.keys(variables).length > 0) {
        addMessage(sessionId, "user", `Context: ${JSON.stringify(variables)}`);
      }

      // Stream response
      const stream = await openai.responses.stream({
        ...defaultAIConfig,
        tools,
        input: getHistory(sessionId),
      });

      let assistantReply = "";

      for await (const event of stream) {
        if (event.type === "response.output_text.delta") {
          assistantReply += event.delta;
          ws.send(JSON.stringify({ token: event.delta }));
        } else if (event.type === "response.completed") {
          addMessage(sessionId, "assistant", assistantReply);
          ws.send(JSON.stringify({ event: "end" }));
        }
      }
    } catch (err) {
      console.error("❌ WS error:", err);
      ws.send(JSON.stringify({ error: "AI request failed" }));
    }
  });

  ws.on("close", () => {
    console.log("❌ WebSocket client disconnected");
  });
});

// --- Basic REST endpoint ---
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket available at ws://localhost:${PORT}`);
});
