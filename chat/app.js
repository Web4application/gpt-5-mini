const chat = document.getElementById("chat");
const input = document.getElementById("input");
const sendBtn = document.getElementById("send");

async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  addMessage("You: " + text, "user");
  input.value = "";

  try {
    const res = await fetch("http://localhost:3000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });

    const data = await res.json();
    addMessage("AI: " + data.reply, "ai");
  } catch (err) {
    addMessage("⚠️ Error connecting to backend", "ai");
  }
}

function addMessage(text, cls) {
  const msg = document.createElement("div");
  msg.className = `msg ${cls}`;
  msg.textContent = text;
  chat.appendChild(msg);
  chat.scrollTop = chat.scrollHeight;
}

sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keypress", e => {
  if (e.key === "Enter") sendMessage();
});

// Register service worker for PWA
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js")
    .then(() => console.log("✅ Service Worker registered"))
    .catch(err => console.error("SW registration failed:", err));
}
