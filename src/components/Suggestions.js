export default function Suggestions({ suggestions, setPrompt }) {
  return (
    <div className="flex mb-2 space-x-2">
      {suggestions.map((s, i) => (
        <button key={i} onClick={() => setPrompt(s)} className="text-sm bg-gray-300 px-2 py-1 rounded hover:bg-gray-400">
          {s}
        </button>
      ))}
    </div>
  );
}
