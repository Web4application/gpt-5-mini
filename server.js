// ----------- Strict CORS Proxy (methods + hosts locked) -----------
const ALLOWED_HOSTS = new Set([
  "jsonplaceholder.typicode.com",
  "api.example.com",
  "kubuverse.com",
  "qubuhub.com",
  "kubulee.com",
  "web4era.com",
  "rodaverse.com",
  "gpt5mini.ai",
  "lolaai.app",
  "kubuhai.ai",
  "projectpilot.ai",
  "fadaka.io",
  "fadakachain.com",
  "web4chain.com",
  "cryptoverse.africa",
  "roda.ai",
  "rodahub.com",
  "datarepublic.ai"
]);

const ALLOWED_METHODS = new Set(["GET", "POST"]); // 🔒 no PUT, DELETE, PATCH, etc.

app.all("/api/cors/*", async (req, res) => {
  try {
    const targetUrl = req.originalUrl.replace("/api/cors/", "");
    if (!targetUrl || !targetUrl.startsWith("http")) {
      return res.status(400).json({ error: "Invalid target URL" });
    }

    // 🔒 Method check
    if (!ALLOWED_METHODS.has(req.method)) {
      return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }

    const { hostname } = new URL(targetUrl);

    // 🔒 Hostname check
    if (!ALLOWED_HOSTS.has(hostname)) {
      return res.status(403).json({ error: `Blocked: ${hostname} not in allowlist` });
    }

    const options = {
      method: req.method,
      headers: { ...req.headers },
      body: req.method === "POST" ? JSON.stringify(req.body) : undefined,
    };

    delete options.headers["host"];
    delete options.headers["origin"];
    delete options.headers["referer"];

    const response = await fetch(targetUrl, options);

    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));

    const text = await response.text();
    res.send(text);
  } catch (err) {
    console.error("CORS Proxy Error:", err);
    res.status(500).json({ error: "Proxy failed", details: err.message });
  }
});
