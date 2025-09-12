import ReactMarkdown from "react-markdown";

export default function MessageBubble({ msg }) {
  return (
    <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
      <div className={`px-4 py-2 rounded-lg max-w-xs ${msg.role === "user" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"}`}>
        <ReactMarkdown>{msg.content}</ReactMarkdown>
        <div className="text-xs mt-1 text-gray-400">{new Date(msg.timestamp).toLocaleTimeString()}</div>
      </div>
    </div>
  );
}
