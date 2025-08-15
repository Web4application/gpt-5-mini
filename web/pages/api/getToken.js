// server-side token fetcher used by UI to get a short-lived JWT for demo
export default async function handler(req, res) {
  const backend = process.env.BACKEND_URL || "http://localhost:8000";
  // In real prod: do OAuth or a secure login flow.
  const loginResp = await fetch(`${backend}/auth/login`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ username: "admin", password: "change_this_pass" })
  });
  const data = await loginResp.json();
  if (!loginResp.ok) return res.status(401).json({ error: "Unable to auth" });
  res.setHeader('Content-Type','application/json');
  res.end(JSON.stringify(data));
}
