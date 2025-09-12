import React, { useState, useRef, useEffect } from "react";

export default function Chat() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("chatHistory");
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("chatHistory", JSON.stringify(messages));
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendPrompt = () => {
    if (!prompt.trim()) return;

    const userMsg = { role: "user", content: prompt };
    setMessages((prev) => [...prev, userMsg]);
    setPrompt("");
    setLoading(true);

    let aiMsg = { role: "assistant", content: "" };
    setMessages((prev) => [...prev, aiMsg]);

    const eventSource = new EventSourcePolyfill("http://localhost:5000/api/ask-stream", {
      headers: { "Content-Type": "application/json" },
      payload: JSON.stringify({ prompt })
    });

    eventSource.onmessage = (e) => {
      if (e.data === "[DONE]") {
        setLoading(false);
        eventSource.close();
        return;
      }
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1].content += JSON.parse(e.data);
        return updated;
      });
    };

    eventSource.onerror = (err) => {
      console.error("Stream error:", err);
      eventSource.close();
      setLoading(false);
    };
  };

  return (
    <div className="bg-white shadow-lg rounded-lg w-full max-w-2xl flex flex-col p-4">
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
