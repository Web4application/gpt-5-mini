import React, { useState } from "react";
import { generateImage } from "../api/gpt5mini";

export default function ImageGen() {
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const handleGenerate = async () => {
    const res = await generateImage(prompt);
    setImageUrl(res.data.url);
  };

  return (
    <div>
      <h2>Image Generator</h2>
      <input value={prompt} onChange={(e) => setPrompt(e.target.value)} />
      <button onClick={handleGenerate}>Generate</button>
      {imageUrl && <img src={imageUrl} alt="Generated" />}
    </div>
  );
}
