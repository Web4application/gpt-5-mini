export default function SettingsPanel({ typingSpeed, setTypingSpeed, darkMode, setDarkMode, clearHistory, exportChat }) {
  return (
    <div className="flex justify-between mb-2">
      <div className="space-x-2">
        <button onClick={clearHistory} className="text-sm text-red-500 hover:underline">Clear Chat</button>
        <button onClick={exportChat} className="text-sm text-green-500 hover:underline">Export Chat</button>
        <button onClick={() => setDarkMode(!darkMode)} className="text-sm text-blue-500 hover:underline">Toggle Theme</button>
      </div>
      <div className="flex items-center space-x-2">
        <input type="range" min="10" max="100" value={typingSpeed} onChange={(e) => setTypingSpeed(Number(e.target.value))} />
        <span className="text-sm">Typing Speed</span>
      </div>
    </div>
  );
}
