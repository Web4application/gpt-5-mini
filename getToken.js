import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { dbConnect } from '../../lib/dbConnect';
import User from '../../models/User';

export default async function handler(req, res) {
  await dbConnect();

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const user = await User.findOne({ username });
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  const token = jwt.sign({ username }, process.env.APP_SECRET, { expiresIn: '1h' });
  res.status(200).json({ token });
}
