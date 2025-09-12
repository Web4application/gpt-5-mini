import React, { useState } from "react";
import { synthesizeSpeech } from "../api/gpt5mini";

export default function TextToSpeech() {
  const [text, setText] = useState("");

  const handleSpeak = async () => {
    const res = await synthesizeSpeech(text);
    const audioBlob = new Blob([res.data], { type: "audio/mpeg" });
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audio.play();
  };

  return (
    <div>
      <h2>Text to Speech</h2>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} />
      <button onClick={handleSpeak}>🔊 Speak</button>
    </div>
  );
}
