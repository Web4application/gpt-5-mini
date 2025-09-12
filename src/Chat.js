import React, { useState, useRef, useEffect } from "react";

export default function Chat() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("chatHistory");
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);
  const typingBuffer = useRef(""); // holds incoming text before animation
  const typingTimeout = useRef(null);

  // Save history to localStorage whenever messages change
  useEffect(() => {
    localStorage.setItem("chatHistory", JSON.stringify(messages));
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendPrompt = () => {
    if (!prompt.trim()) return;

    // Add user message
    setMessages((prev) => [...prev, { role: "user", content: prompt }]);
    setPrompt("");
    setLoading(true);

    // Add empty assistant message
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    const eventSource = new EventSource(
      `http://localhost:5000/chat?prompt=${encodeURIComponent(prompt)}`
    );

    eventSource.onmessage = (event) => {
      if (event.data === "[DONE]") {
        setLoading(false);
        eventSource.close();
        return;
      }

      // Add incoming chunk to buffer
      typingBuffer.current += JSON.parse(event.data);

      // Start animation loop if not already running
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

    typingTimeout.current = setTimeout(animateTyping, 20); // speed in ms per char
  };

  const clearHistory = () => {
    localStorage.removeItem("chatHistory");
    setMessages([]);
  };

  return (
    <div className="bg-white shadow-lg rounded-lg w-full max-w-2xl flex flex-col p-4">
      <div className="flex justify-between mb-2">
        <h2 className="text-lg font-bold">GPT‑5‑mini Chat</h2>
        <button
          onClick={clearHistory}
          className="text-sm text-red-500 hover:underline"
        >
          Clear Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto mb-4 space-y-3">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`px-4 py-2 rounded-lg max-w-xs ${
                msg.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="px-4 py-2 rounded-lg bg-gray-200 text-gray-500 italic">
              Typing…
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
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
          className="bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600"
          disabled={loading}
        >
          Send
        </button>
      </div>
    </div>
  );
}
