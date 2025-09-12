import React, { useState, useEffect } from "react";
import axios from "axios";

const ChatBox = () => {
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState("");
  const [streaming, setStreaming] = useState(false);

  const handleSubmit = async () => {
    setStreaming(false);
    const res = await axios.post("/api/gpt5-mini", { prompt });
    setReply(res.data.reply);
  };

  const handleStream = () => {
    setStreaming(true);
    setReply("");
    const eventSource = new EventSource(`/api/chat/stream?message=${encodeURIComponent(prompt)}`);

    eventSource.onmessage = (event) => {
      if (event.data === "[END]") {
        eventSource.close();
        setStreaming(false);
      } else {
        const { delta } = JSON.parse(event.data);
        setReply((prev) => prev + delta);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      setStreaming(false);
    };
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>GPT-5 Mini Chat</h2>
      <textarea
        rows="4"
        cols="50"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Type your prompt here..."
      />
      <br />
      <button onClick={handleSubmit}>Submit</button>
      <button onClick={handleStream} disabled={streaming}>Stream</button>
      <div style={{ marginTop: "1rem", whiteSpace: "pre-wrap" }}>
        <strong>Response:</strong>
        <p>{reply}</p>
      </div>
    </div>
  );
};

export default ChatBox;
