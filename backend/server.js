// backend/server.js
import { supabase } from './supabaseClient.js';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js'; // import signup/login routes

dotenv.config(); // load .env variables

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Mount auth routes
app.use('/api/auth', authRoutes);

// Test route
app.get('/', (req, res) => {
  res.send('Supabase backend is running!');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
