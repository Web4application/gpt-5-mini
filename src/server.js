import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const FAV_FILE = path.join(DATA_DIR, 'favorites.json');

const JOKEAPI_BASE = 'https://v2.jokeapi.dev';
const FALLBACK_BASE = 'https://official-joke-api.appspot.com';

const DEFAULT_PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const JOKE_TIMEOUT = process.env.JOKE_TIMEOUT_MS ? Number(process.env.JOKE_TIMEOUT_MS) : 9000;

const app = express();

// Ensure data dir and favorites file exist
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}
if (!existsSync(FAV_FILE)) {
  // create initial empty favorites
  await fs.writeFile(FAV_FILE, JSON.stringify([], null, 2), 'utf8');
}

// Middleware
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(morgan('tiny'));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Helpers

async function readFavorites() {
  try {
    const raw = await fs.readFile(FAV_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    console.error('readFavorites error', err);
    return [];
  }
}

async function writeFavorites(list) {
  await fs.writeFile(FAV_FILE, JSON.stringify(list, null, 2), 'utf8');
}

function buildJokeApiUrl({ category = 'Any', type = 'Any', safe = false, lang = 'en' } = {}) {
  const url = new URL(`${JOKEAPI_BASE}/joke/${encodeURIComponent(category)}`);
  url.searchParams.set('lang', lang);
  if (type && type !== 'Any') url.searchParams.set('type', type);
  if (safe) url.searchParams.set('blacklistFlags', 'nsfw,religious,political,racist,sexist,explicit');
  return url.toString();
}

async function fetchWithTimeout(url, opts = {}, timeout = JOKE_TIMEOUT) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal, ...opts });
    return res;
  } finally {
    clearTimeout(id);
  }
}

function normalizeJokeApiResponse(resp) {
  if (!resp) return null;
  if (resp.error) return { error: resp.message || 'JokeAPI error' };
  return {
    id: resp.id ?? null,
    type: resp.type ?? (resp.setup && resp.delivery ? 'twopart' : 'single'),
    joke: resp.joke ?? null,
    setup: resp.setup ?? null,
    delivery: resp.delivery ?? null,
    category: resp.category ?? 'Unknown',
    lang: resp.lang ?? 'en'
  };
}

function normalizeFallback(resp) {
  if (!resp) return null;
  return {
    id: resp.id ?? null,
    type: resp.type === 'general' && resp.punchline ? 'single' : (resp.type || 'twopart'),
    joke: resp.setup && !resp.punchline ? resp.setup : null,
    setup: resp.setup ?? null,
    delivery: resp.punchline ?? resp.delivery ?? null,
    category: resp.type ?? 'Misc',
    lang: 'en'
  };
}

// Routes

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), now: new Date().toISOString() });
});

// Primary joke endpoint used by the gpt5-mini frontend.
// GET /api/joke?category=Any&type=Any&safe=false&lang=en
app.get('/api/joke', async (req, res) => {
  const { category = 'Any', type = 'Any', safe = 'false', lang = 'en', fallback } = req.query;
  const safeMode = String(safe) === 'true';
  const useFallback = fallback === '1' || fallback === 'true';

  if (useFallback) {
    try {
      const r = await fetchWithTimeout(`${FALLBACK_BASE}/random_joke`);
      if (!r.ok) throw new Error(`Fallback HTTP ${r.status}`);
      const data = await r.json();
      return res.json({ source: 'fallback', joke: normalizeFallback(data) });
    } catch (err) {
      return res.status(502).json({ error: 'Fallback failed', detail: String(err) });
    }
  }

  try {
    const url = buildJokeApiUrl({ category, type, safe: safeMode, lang });
    const r = await fetchWithTimeout(url);
    if (!r.ok) throw new Error(`Primary HTTP ${r.status}`);
    const data = await r.json();
    const normalized = normalizeJokeApiResponse(data);
    if (normalized.error) throw new Error(normalized.error);
    return res.json({ source: 'jokeapi', joke: normalized });
  } catch (err) {
    // fallback attempt
    try {
      const r2 = await fetchWithTimeout(`${FALLBACK_BASE}/random_joke`);
      if (!r2.ok) throw new Error(`Fallback HTTP ${r2.status}`);
      const data2 = await r2.json();
      return res.json({ source: 'fallback', joke: normalizeFallback(data2), warning: String(err) });
    } catch (err2) {
      return res.status(502).json({ error: 'Both primary and fallback failed', detail: String(err), detail2: String(err2) });
    }
  }
});

// SSE streaming endpoint for two-part jokes (compatible with frontends using EventSource)
// GET /api/joke/stream?category=Any&type=Any&safe=false&lang=en
app.get('/api/joke/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Connection', 'keep-alive');

  const { category = 'Any', type = 'Any', safe = 'false', lang = 'en' } = req.query;
  const safeMode = String(safe) === 'true';

  try {
    const url = buildJokeApiUrl({ category, type, safe: safeMode, lang });
    const r = await fetchWithTimeout(url);
    if (!r.ok) {
      res.write(`event: error\ndata: ${JSON.stringify({ message: 'Primary HTTP error', status: r.status })}\n\n`);
      res.end();
      return;
    }
    const data = await r.json();
    const j = normalizeJokeApiResponse(data);
    if (j.error) {
      res.write(`event: error\ndata: ${JSON.stringify({ message: j.error })}\n\n`);
      res.end();
      return;
    }

    if (j.type === 'single') {
      res.write(`data: ${JSON.stringify({ type: 'single', joke: j.joke })}\n\n`);
      res.write(`data: [END]\n\n`);
      res.end();
      return;
    }

    // two-part: stream setup then delivery
    res.write(`data: ${JSON.stringify({ type: 'twopart', stage: 'setup', setup: j.setup })}\n\n`);
    // small pause to mimic streaming/deliver effect
    await new Promise((r2) => setTimeout(r2, 700));
    res.write(`data: ${JSON.stringify({ type: 'twopart', stage: 'delivery', delivery: j.delivery })}\n\n`);
    res.write(`data: [END]\n\n`);
    res.end();
  } catch (err) {
    res.write(`event: error\ndata: ${JSON.stringify({ message: String(err) })}\n\n`);
    res.end();
  }
});

// Backwards-compatible endpoint matching gpt5-mini's chat SSE usage:
// The frontend used EventSource(`/api/chat?message=...`). We provide /api/chat that ignores the message body and returns a joke stream.
// GET /api/chat?message=...
app.get('/api/chat', async (req, res) => {
  // For chat-style integration, map to joke/stream with Any category.
  // This keeps gpt5-mini frontend working if it expects streaming text in SSE chunks.
  req.url = '/api/joke/stream' + req.url.slice(req.url.indexOf('?') >= 0 ? req.url.indexOf('?') : 0);
  return app._router.handle(req, res);
});

// POST /api/chat - returns a single JSON reply (for fetch-based clients)
app.post('/api/chat', async (req, res) => {
  const body = req.body || {};
  // If frontend sends { message: "tell me a joke" }, ignore content and return random joke
  try {
    const url = buildJokeApiUrl({ category: 'Any', type: 'Any', safe: false, lang: 'en' });
    const r = await fetchWithTimeout(url);
    if (!r.ok) throw new Error(`Primary HTTP ${r.status}`);
    const data = await r.json();
    const normalized = normalizeJokeApiResponse(data);
    if (normalized.error) throw new Error(normalized.error);
    return res.json({ reply: normalized.type === 'single' ? normalized.joke : `${normalized.setup}\n\n${normalized.delivery}`, joke: normalized });
  } catch (err) {
    // fallback
    try {
      const r2 = await fetchWithTimeout(`${FALLBACK_BASE}/random_joke`);
      if (!r2.ok) throw new Error(`Fallback HTTP ${r2.status}`);
      const data2 = await r2.json();
      const norm = normalizeFallback(data2);
      return res.json({ reply: norm.type === 'single' ? norm.joke : `${norm.setup}\n\n${norm.delivery}`, joke: norm, fallback: true });
    } catch (err2) {
      return res.status(502).json({ error: 'Both primary and fallback failed', detail: String(err), detail2: String(err2) });
    }
  }
});

// Favorites endpoints (simple file-backed persistence)

// GET /api/favorites
app.get('/api/favorites', async (req, res) => {
  const list = await readFavorites();
  res.json(list);
});

// POST /api/favorites
// body: { joke: { id, type, joke?, setup?, delivery?, category, lang } }
app.post('/api/favorites', async (req, res) => {
  const payload = req.body;
  const joke = payload?.joke ?? payload;
  if (!joke || (!joke.joke && !(joke.setup && joke.delivery))) {
    return res.status(400).json({ error: 'Invalid joke payload' });
  }
  const list = await readFavorites();
  // dedupe by exact joke content
  if (list.some((x) => JSON.stringify(x.joke) === JSON.stringify(joke))) {
    return res.status(409).json({ error: 'Duplicate favorite' });
  }
  const item = { id: randomUUID(), createdAt: new Date().toISOString(), joke };
  list.unshift(item);
  await writeFavorites(list.slice(0, 200));
  res.status(201).json(item);
});

// DELETE /api/favorites/:id
app.delete('/api/favorites/:id', async (req, res) => {
  const id = req.params.id;
  const list = await readFavorites();
  const idx = list.findIndex((x) => x.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  list.splice(idx, 1);
  await writeFavorites(list);
  res.json({ success: true });
});

// Simple human-friendly index
app.get('/', (req, res) => {
  res.type('text').send(
    `gpt5-mini joke API running.

Available endpoints:
- GET /health
- GET /api/joke
- GET /api/joke/stream (SSE)
- GET /api/chat?message=... (SSE compatible for gpt5-mini frontend)
- POST /api/chat (json reply)
- GET/POST/DELETE /api/favorites

See README for details.
`
  );
});

app.listen(DEFAULT_PORT, () => {
  console.log(`gpt5-mini joke API listening on port ${DEFAULT_PORT}`);
});
