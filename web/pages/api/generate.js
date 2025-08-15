export default async function handler(req, res) {
  const backend = process.env.BACKEND_URL || "http://localhost:8000";
  const { prompt } = req.body;
  // client should call getToken first and store token in cookie; here we get one for demo
  const tokenResp = await fetch(`${process.env.BACKEND_URL || backend}/auth/login`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ username: "admin", password: "change_this_pass" })
  });
  const tokenData = await tokenResp.json();
  if (!tokenResp.ok) return res.status(401).json({ error: 'auth failed' });

  const r = await fetch(`${backend}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${tokenData.access_token}` },
    body: JSON.stringify({ prompt })
  });
  const data = await r.json();
  res.status(r.status).json(data);
}
