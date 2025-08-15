// web/pages/api/generate.js
export default async function handler(req, res) {
  const token = req.cookies['access_token']; // or client sends bearer
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  const body = await fetch(process.env.BACKEND_URL + '/api/generate', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(req.body)
  });
  const data = await body.json();
  res.status(body.status).json(data);
}
