import { useState, useEffect, useRef } from "react";
import MessageBubble from "../components/MessageBubble";
import ChatInput from "../components/ChatInput";
import Suggestions from "../components/Suggestions";
import SettingsPanel from "../components/SettingsPanel";
import SessionSidebar from "../components/SessionSidebar";
import { fetchResponse } from "../services/api";

export default function ChatPage() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(20);
  const [darkMode, setDarkMode] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendPrompt = async () => {
    if (!prompt.trim()) return;
    const timestamp = new Date().toISOString();
    setMessages((prev) => [...prev, { role: "user", content: prompt, timestamp }, { role: "assistant", content: "", timestamp }]);
    setPrompt("");
    setLoading(true);

    const response = await fetchResponse(prompt);
    let buffer = response.text;
    let index = 0;

    const animateTyping = () => {
      if (index >= buffer.length) {
        setLoading(false);
        generateSuggestions();
        return;
      }
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1].content += buffer[index];
        return updated;
      });
      index++;
      setTimeout(animateTyping, typingSpeed);
    };

    animateTyping();
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Speech recognition not supported");
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      setPrompt(event.results[0][0].transcript);
    };
    recognition.start();
  };

  const clearHistory = () => setMessages([]);
  const exportChat = () => {
    const blob = new Blob([JSON.stringify(messages, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "chat-history.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateSuggestions = () => {
    setSuggestions(["Can you explain more?", "Give an example.", "What’s next?", "Summarize that."]);
  };

  return (
    <div className={`${darkMode ? "bg-gray-900 text-white" : "bg-white text-black"} flex`}>
      {/* <SessionSidebar /> — Add when session logic is ready */}
      <div className="flex flex-col w-full max-w-2xl p-4">
        <SettingsPanel {...{ typingSpeed, setTypingSpeed, darkMode, setDarkMode, clearHistory, exportChat }} />
        <div className="flex-1 overflow-y-auto mb-4 space-y-3">
          {messages.map((msg, idx) => <MessageBubble key={idx} msg={msg} />)}
          {loading && <div className="px-4 py-2 rounded-lg bg-gray-200 text-gray-500 italic">Typing…</div>}
          <div ref={chatEndRef} />
        </div>
        <Suggestions {...{ suggestions, setPrompt }} />
        <ChatInput {...{ prompt, setPrompt, sendPrompt, loading, startListening }} />
      </div>
    </div>
  );
}
