// frontend/remote-work-collaborate-suite/src/supabaseClient.js

import { createClient } from '@supabase/supabase-js';


// 🔑 Replace these with your own project values
const supabaseUrl = "https://zfjdebazaezeaugmtqvy.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmamRlYmF6YWV6ZWF1Z210cXZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzODI3MjMsImV4cCI6MjA3Mzk1ODcyM30.bqnsMpN0WGs5p2hpREkKVQQJ0cGBYXU6E4Jlfxt7F0M";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
