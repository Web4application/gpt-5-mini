export default async function handler(req, res) {
  const jwt = require('jsonwebtoken');
  const token = jwt.sign(
    { username: "demo", exp: Math.floor(Date.now() / 1000) + 3600 },
    process.env.APP_SECRET
  );
  res.status(200).json({ token });
}
