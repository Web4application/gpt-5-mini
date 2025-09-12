export default function ChatInput({ prompt, setPrompt, sendPrompt, loading, startListening }) {
  return (
    <div className="flex">
      <input
        type="text"
        className="flex-1 border border-gray-300 rounded-l-lg px-3 py-2 focus:outline-none"
        placeholder="Type your message..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && sendPrompt()}
      />
      <button onClick={sendPrompt} className="bg-blue-500 text-white px-4 py-2 hover:bg-blue-600" disabled={loading}>Send</button>
      <button onClick={startListening} className="bg-gray-500 text-white px-4 py-2 rounded-r-lg hover:bg-gray-600">🎤</button>
    </div>
  );
}
