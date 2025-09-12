import React, { useState } from "react";
import { detectIntent } from "../api/gpt5mini";

export default function IntentRecognizer() {
  const [intent, setIntent] = useState("");

  const handleDetect = async () => {
    // Assume you have an audioBlob from a recorder
    const res = await detectIntent(audioBlob);
    setIntent(res.data.intent);
  };

  return (
    <div>
      <h2>Intent Recognition</h2>
      <button onClick={handleDetect}>Detect</button>
      <p>{intent}</p>
    </div>
  );
}
