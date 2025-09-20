import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { supabase } from './supabaseClient.js';

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 5000;

// Test route
app.get('/', (req, res) => {
  res.send('Supabase backend is running!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
