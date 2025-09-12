export default function SessionSidebar({ sessions, activeSessionId, setActiveSession }) {
  return (
    <div className="w-64 bg-gray-100 p-4">
      <h3 className="font-bold mb-2">Sessions</h3>
      {sessions.map((s) => (
        <button key={s.id} onClick={() => setActiveSession(s.id)} className={`block w-full text-left px-2 py-1 mb-1 rounded ${s.id === activeSessionId ? "bg-blue-200" : "hover:bg-gray-200"}`}>
          {s.title}
        </button>
      ))}
    </div>
  );
}
