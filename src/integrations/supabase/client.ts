// Supabase browser client
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// IMPORTANT: this is the actual Supabase project ref currently connected to the app.
// Keep VITE_SUPABASE_URL as the preferred production value, with the correct
// project URL as the safe fallback.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://iifwenfvggpurohobsbq.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('Missing VITE_SUPABASE_PUBLISHABLE_KEY. Add it to the Vercel Production environment and redeploy.');
}

const client = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const supabase = client;
