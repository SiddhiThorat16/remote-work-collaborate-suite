// routes/call.js
import express from 'express';
import { supabase } from '../supabaseClient.js';

const router = express.Router();

router.post('/start', async (req, res) => {
  const { email, callerId } = req.body;

  if (!email) return res.status(400).json({ error: 'Email is required' });

  // Look up user by email in Supabase
  const { data: users, error } = await supabase
    .from('users')
    .select('id,email')
    .eq('email', email)
    .single();

  if (error || !users) {
    return res.status(404).json({ error: 'User not found' });
  }

  const calleeId = users.id;  // Supabase user's ID
  const roomId = `call-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

  return res.json({ roomId, calleeId });
});

export default router;
