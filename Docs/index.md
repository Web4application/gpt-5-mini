<!DOCTYPE html>
<html lang="en-US">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="ChatGPT5 mini helps you get answers, find inspiration and be more productive. Free to use and easy to try." />
  <meta name="keywords" content="ChatGPT5 mini, AI assistant, productivity chatbot, writing help, brainstorm tool" />
  <meta property="og:title" content="GPT-5 mini" />
  <meta property="og:description" content="A conversational AI system that listens, learns, and challenges" />
  <meta property="og:image" content="https://cdn.oaistatic.com/assets/chatgpt-share-og-u7j5uyao.webp" />
  <meta property="og:url" content="https://GPT-5-mini.com/" />
  <link rel="canonical" href="https://GPT-5-mini.com/" />
  <link rel="icon" href="favicon.png" sizes="32x32" />
  <link rel="apple-touch-icon" sizes="180x180" href="logo.png" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet" />
  <title>ChatGPT5 mini</title>

  <style>
    body {
      font-family: 'Inter', sans-serif;
      margin: 0;
      padding: 0;
      background: #fff;
      color: #222;
      transition: background 0.3s, color 0.3s;
    }

    /* Hero */
    .hero {
      text-align: center;
      padding: 60px 20px;
      background: linear-gradient(to right, #6a11cb, #2575fc);
      color: white;
    }
    .hero img {
      height: 64px;
      margin-bottom: 20px;
    }
    .cta-button {
      background: white;
      color: #2575fc;
      padding: 12px 24px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: bold;
    }

    /* Chat Section */
    #chat-preview {
      padding: 40px 20px;
      text-align: center;
    }
    #chat-container {
      max-width: 600px;
      margin: 20px auto;
      background: #f4f4f4;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      height: 400px;
    }
    #chat {
      flex: 1;
      overflow-y: auto;
      margin-bottom: 10px;
      text-align: left;
    }
    .msg {
      margin: 8px 0;
      padding: 10px 14px;
      border-radius: 10px;
      line-height: 1.4;
      max-width: 80%;
    }
    .user { background: #2575fc; color: #fff; margin-left: auto; }
    .ai { background: #e0e0e0; color: #222; margin-right: auto; }
    #input-bar {
      display: flex;
    }
    #input {
      flex: 1;
      padding: 10px;
      border: none;
      border-radius: 8px 0 0 8px;
    }
    #send {
      background: #2575fc;
      border: none;
      color: white;
      padding: 0 20px;
      border-radius: 0 8px 8px 0;
      cursor: pointer;
    }

    /* Testimonials */
    .testimonials {
      padding: 40px 20px;
      background: #fafafa;
      text-align: center;
    }
    .testimonials blockquote {
      font-style: italic;
      margin: 10px 0;
    }

    /* Dark mode */
    .dark-mode {
      background-color: #121212;
      color: #f0f0f0;
    }
    .dark-mode #chat-container { background: #1e1e1e; }
    .dark-mode .ai { background: #333; color: #f0f0f0; }

    footer {
      text-align: center;
      padding: 20px;
      background: #eee;
    }

    @media (max-width: 768px) {
      .hero, #chat-container, .testimonials {
        padding: 20px;
        font-size: 16px;
      }
    }
  </style>
</head>

<body>
  <section class="hero">
    <img src="logo.png" alt="ChatGPT5 mini logo" />
    <h1>Welcome to ChatGPT5 mini</h1>
    <p>Your AI companion for writing, learning, and productivity.</p>
    <a href="#chat-preview" class="cta-button">Try It Now</a>
  </section>

  <button onclick="document.body.classList.toggle('dark-mode')">Toggle Dark Mode</button>

  <!-- Chat Section -->
  <section id="chat-preview">
    <h2>See ChatGPT5 mini in Action</h2>
    <div id="chat-container">
      <div id="chat"></div>
      <div id="input-bar">
        <input id="input" type="text" placeholder="Say something…" />
        <button id="send">Send</button>
      </div>
    </div>
  </section>

  <!-- Testimonials -->
  <section class="testimonials">
    <h2>Why People Love ChatGPT5 mini</h2>
    <blockquote>"Helped me write my resume in minutes!" – Ada</blockquote>
    <blockquote>"Great for quick brainstorming before meetings." – Tunde</blockquote>
  </section>

  <footer>
    <p>We respect your privacy. No data is stored without your consent.</p>
    <a href="https://github.com/Web4application/roupg" target="_blank">View Source on GitHub</a>
  </footer>

  <!-- Chat Logic -->
  <script>
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
  </script>
</body>
</html>
