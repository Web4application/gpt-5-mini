// Chat component
import React, { useState } from "react";
import { chat } from "../api/gpt5mini";

export default function ChatBox() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");

  const handleSend = async () => {
    const res = await chat(input);
    setResponse(res.data.reply);
  };

  return (
    <div>
      <h2>Chat</h2>
      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <button onClick={handleSend}>Send</button>
      <p>{response}</p>
    </div>
  );
}
