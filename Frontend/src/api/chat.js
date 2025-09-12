import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

export default function Chat() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("chatHistory");
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(20);
  const [darkMode, setDarkMode] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const chatEndRef = useRef(null);
  const typingBuffer = useRef("");
  const typingTimeout = useRef(null);

  useEffect(() => {
    localStorage.setItem("chatHistory", JSON.stringify(messages));
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendPrompt = () => {
    if (!prompt.trim()) return;
    const timestamp = new Date().toISOString();
    setMessages((prev) => [...prev, { role: "user", content: prompt, timestamp }]);
    setPrompt("");
    setLoading(true);
    setMessages((prev) => [...prev, { role: "assistant", content: "", timestamp }]);

    const eventSource = new EventSource(`http://localhost:5000/chat?prompt=${encodeURIComponent(prompt)}`);
    eventSource.onmessage = (event) => {
      if (event.data === "[DONE]") {
        setLoading(false);
        eventSource.close();
        generateSuggestions();
        return;
      }
      typingBuffer.current += JSON.parse(event.data);
      if (!typingTimeout.current) {
        animateTyping();
      }
    };
    eventSource.onerror = (err) => {
      console.error("Stream error:", err);
      eventSource.close();
      setLoading(false);
    };
  };

  const animateTyping = () => {
    if (typingBuffer.current.length === 0) {
      typingTimeout.current = null;
      return;
    }
    const nextChar = typingBuffer.current.charAt(0);
    typingBuffer.current = typingBuffer.current.slice(1);
    setMessages((prev) => {
      const updated = [...prev];
      updated[updated.length - 1].content += nextChar;
      return updated;
    });
    typingTimeout.current = setTimeout(animateTyping, typingSpeed);
  };

  const clearHistory = () => {
    localStorage.removeItem("chatHistory");
    setMessages([]);
    setSuggestions([]);
  };

  const exportChat = () => {
    const blob = new Blob([JSON.stringify(messages, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "chat-history.json";
    a.click();
    URL.revokeObjectURL(url);
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

  const generateSuggestions = () => {
    const lastMsg = messages[messages.length - 1]?.content || "";
    const basicSuggestions = [
      "Can you explain more?",
      "Give an example.",
      "What’s next?",
      "Summarize that.",
    ];
    setSuggestions(basicSuggestions);
  };

  return (
    <div className={`${darkMode ? "bg-gray-900 text-white" : "bg-white text-black"} shadow-lg rounded-lg w-full max-w-2xl flex flex-col p-4`}>
      <div className="flex justify-between mb-2">
        <h2 className="text-lg font-bold">GPT‑5‑mini Chat</h2>
        <div className="space-x-2">
          <button onClick={clearHistory} className="text-sm text-red-500 hover:underline">Clear Chat</button>
          <button onClick={exportChat} className="text-sm text-green-500 hover:underline">Export Chat</button>
          <button onClick={() => setDarkMode(!darkMode)} className="text-sm text-blue-500 hover:underline">Toggle Theme</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto mb-4 space-y-3">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`px-4 py-2 rounded-lg max-w-xs ${msg.role === "user" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"}`}>
              <ReactMarkdown>{msg.content}</ReactMarkdown>
              <div className="text-xs mt-1 text-gray-400">{new Date(msg.timestamp).toLocaleTimeString()}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="px-4 py-2 rounded-lg bg-gray-200 text-gray-500 italic">Typing…</div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="flex items-center space-x-2 mb-2">
        <input
          type="range"
          min="10"
          max="100"
          value={typingSpeed}
          onChange={(e) => setTypingSpeed(Number(e.target.value))}
        />
        <span className="text-sm">Typing Speed</span>
      </div>

      <div className="flex mb-2 space-x-2">
        {suggestions.map((s, i) => (
          <button key={i} onClick={() => setPrompt(s)} className="text-sm bg-gray-300 px-2 py-1 rounded hover:bg-gray-400">
            {s}
          </button>
        ))}
      </div>

      <div className="flex">
        <input
          type="text"
          className="flex-1 border border-gray-300 rounded-l-lg px-3 py-2 focus:outline-none"
          placeholder="Type your message..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendPrompt()}
        />
        <button
          onClick={sendPrompt}
          className="bg-blue-500 text-white px-4 py-2 hover:bg-blue-600"
          disabled={loading}
        >
          Send
        </button>
        <button
          onClick={startListening}
          className="bg-gray-500 text-white px-4 py-2 rounded-r-lg hover:bg-gray-600"
        >
          🎤
        </button>
      </div>
    </div>
  );
}
