const input = document.getElementById("input");
const send = document.getElementById("send");
const chat = document.getElementById("chat");

function appendMessage(text, sender = "user") {
  const msg = document.createElement("div");
  msg.className = `message ${sender}`;
  msg.textContent = text;
  chat.appendChild(msg);
  chat.scrollTop = chat.scrollHeight;
}

function sendMessage() {
  const message = input.value.trim();
  if (!message) return;

  appendMessage(message, "user");
  input.value = "";

  const eventSource = new EventSource(`/api/chat?message=${encodeURIComponent(message)}`);

  let botMessage = "";
  const botDiv = document.createElement("div");
  botDiv.className = "message bot";
  chat.appendChild(botDiv);

  eventSource.onmessage = (event) => {
    if (event.data === "[END]") {
      eventSource.close();
    } else {
      botMessage += event.data;
      botDiv.textContent = botMessage;
      chat.scrollTop = chat.scrollHeight;
    }
  };

  eventSource.onerror = () => {
    botDiv.textContent = "⚠️ Error receiving response.";
    eventSource.close();
  };
}

send.addEventListener("click", sendMessage);
input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});
