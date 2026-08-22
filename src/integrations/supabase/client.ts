// Supabase browser client
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// IMPORTANT: this is the actual Supabase project ref currently connected to the app.
// Keep VITE_SUPABASE_URL as the preferred production value, with the correct
// project URL as the safe fallback.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://iifwenfvggpurohobsbq.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Create the client even if the key is missing — the page won't crash at import time.
// Supabase operations will fail gracefully at call time with a clear error.
const client = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY || 'missing-key-placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

export const supabase = client;
