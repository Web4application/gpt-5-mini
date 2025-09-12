import React from "react";
import ChatBox from "./components/ChatBox";
import ImageGen from "./components/ImageGen";
import Translator from "./components/Translator";
import IntentRecognizer from "./components/IntentRecognizer";

export default function App() {
  return (
    <div>
      <h1>GPT-5 Mini Dashboard</h1>
      <ChatBox />
      <ImageGen />
      <Translator />
      <IntentRecognizer />
    </div>
  );
}
