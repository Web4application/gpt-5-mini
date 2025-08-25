const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors()); // allow requests from other origins in dev
app.use(express.json());

// Serve static frontend (place your index.html and assets in /public)
app.use(express.static(path.join(__dirname, 'public')));

// POST /api/chat - simple JSON reply (fallback)
app.post('/api/chat', async (req, res) => {
  const { message } = req.body || {};
  if (!message) return res.status(400).json({ error: 'No message provided' });

  // TODO: replace with real model integration (OpenAI, local model, etc.)
  const reply = `Echo: ${message}`;
  res.json({ reply });
});

// GET /api/stream - Server-Sent Events streaming endpoint
app.get('/api/stream', (req, res) => {
  const message = req.query.message || '';

  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.flushHeaders && res.flushHeaders();

  // Example streaming: send a few chunks then send [END]
  const chunks = [
    'Thinking',
    '...',
    ` Replying to: ${message}`
  ];

  let i = 0;
  const interval = setInterval(() => {
    if (i < chunks.length) {
      // SSE message format: data: <payload>\n\n
      res.write(`data: ${chunks[i]}\n\n`);
      i++;
      return;
    }
    // Send end marker and finish
    res.write('data: [END]\n\n');
    clearInterval(interval);
    res.end();
  }, 400);

  req.on('close', () => {
    clearInterval(interval);
  });
});

// Helpful dev route to confirm server is up
app.get('/healthz', (req, res) => res.json({ ok: true }));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server listening on port ${port}`));