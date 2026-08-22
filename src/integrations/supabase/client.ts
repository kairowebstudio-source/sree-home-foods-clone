// Supabase browser client
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ilfwenfvgqpuronobsbq.supabase.co';
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

// Some networks can block direct browser access to *.supabase.co. The admin
// login is therefore proxied through the same-origin TanStack Start server,
// while the resulting Supabase session is still stored in the normal client.
const originalSignInWithPassword = client.auth.signInWithPassword.bind(client.auth);
client.auth.signInWithPassword = (async (credentials, options) => {
  if (typeof window === 'undefined') return originalSignInWithPassword(credentials, options);

  try {
    const response = await fetch('/api/admin-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.session) {
      return {
        data: { user: null, session: null },
        error: new Error(payload.error || `Sign in failed (${response.status})`) as any,
      };
    }

    return client.auth.setSession({
      access_token: payload.session.access_token,
      refresh_token: payload.session.refresh_token,
    });
  } catch (error) {
    return {
      data: { user: null, session: null },
      error: new Error(error instanceof Error ? error.message : 'Unable to sign in right now.') as any,
    };
  }
}) as typeof client.auth.signInWithPassword;

export const supabase = client;
