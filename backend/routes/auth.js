// backend/routes/auth.js
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../supabaseClient.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Helper function to generate human-readable ID
function generateHumanId(name) {
  // Make a simple human-readable ID from name + random suffix
  const shortName = name.toLowerCase().replace(/\s+/g, '_'); // e.g., "Siddhi Thorat" -> "siddhi_thorat"
  const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
  return `${shortName}_${randomSuffix}`;
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });

    // check if user exists
    const { data: existing, error: selErr } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (selErr) throw selErr;
    if (existing) return res.status(400).json({ error: 'User already exists' });

    const hashed = await bcrypt.hash(password, 10); // encrypt password

    // Generate human-readable ID
    const human_id = generateHumanId(name);

    const { data, error } = await supabase
      .from('users')
      .insert([{ name, email, password: hashed, human_id }])
      .select()
      .maybeSingle();

    if (error) throw error;

    // generate JWT
    const token = jwt.sign({ userId: data.id, email: data.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // return safe user data (no password)
    res.json({
      message: 'User created',
      user: { id: data.id, name: data.name, email: data.email, human_id: data.human_id },
      token
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, data.password || '');
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: data.id, email: data.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      message: 'Login successful',
      token,
      user: { id: data.id, name: data.name, email: data.email, human_id: data.human_id }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

export default router;
