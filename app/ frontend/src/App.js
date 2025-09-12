import React from "react";
import Chat from "./Chat";

export default function App() {
  return (
    <div className="bg-gray-100 min-h-screen flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold mb-4">GPT‑5‑mini Assistant</h1>
      <Chat />
    </div>
  );
}

export default App;
