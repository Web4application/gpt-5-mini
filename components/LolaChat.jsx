import React, { useState } from 'react';
import VoiceChat from './VoiceChat';
import SpeechToText from './SpeechToText';

const LolaChat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [lolaReply, setLolaReply] = useState('');

  const handleSend = async (text) => {
    if (!text) return;
    const userMsg = { sender: 'You', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();
      const lolaMsg = { sender: 'Lola', text: data.reply };
      setMessages(prev => [...prev, lolaMsg]);
      setLolaReply(data.reply);
    } catch (err) {
      console.error('Error talking to Lola:', err);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSend(input);
  };

  return (
    <div style={{ maxWidth: 600, margin: 'auto', padding: 20 }}>
      <h2>Talk to Lola</h2>
      <div style={{ border: '1px solid #ccc', padding: 10, height: 300, overflowY: 'auto' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <strong>{msg.sender}:</strong> {msg.text}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} style={{ marginTop: 10 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          style={{ width: '75%', padding: 8 }}
        />
        <button type="submit" style={{ padding: 8 }}>Send</button>
      </form>
      <SpeechToText onTranscribe={handleSend} />
      <VoiceChat message={lolaReply} />
    </div>
  );
};

export default LolaChat;