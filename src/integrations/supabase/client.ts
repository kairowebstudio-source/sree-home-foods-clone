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

// Admin password sign-in is routed through the same-origin server endpoint.
// IMPORTANT: after the server verifies the password, do not immediately call
// auth.getUser() over the network. That was the source of the misleading
// "Failed to fetch" error for valid passwords in this deployment.
let proxyUser: Awaited<ReturnType<typeof client.auth.getUser>>['data']['user'] = null;

const authProxy = new Proxy(client.auth, {
  get(target, property, receiver) {
    if (property === 'signInWithPassword') {
      return async (credentials: { email: string; password: string }, options?: unknown) => {
        if (typeof window === 'undefined') {
          return target.signInWithPassword(credentials, options as never);
        }

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
          if (!response.ok || !payload?.session) {
            return {
              data: { user: null, session: null },
              error: new Error(payload?.error || `Sign in failed (${response.status})`),
            };
          }

          // Store the verified Supabase session locally. setSession itself does
          // not need a second password-auth request. Cache the verified user so
          // the admin page does not immediately make a failing getUser request.
          const result = await target.setSession({
            access_token: payload.session.access_token,
            refresh_token: payload.session.refresh_token,
          });
          proxyUser = result.data.user ?? payload.session.user ?? null;
          return result;
        } catch (error) {
          return {
            data: { user: null, session: null },
            error: new Error(
              error instanceof Error ? error.message : 'Unable to reach the login service.',
            ),
          };
        }
      };
    }

    if (property === 'getUser') {
      return async (...args: Parameters<typeof target.getUser>) => {
        if (proxyUser) {
          return { data: { user: proxyUser }, error: null };
        }
        return target.getUser(...args);
      };
    }

    if (property === 'signOut') {
      return async (...args: Parameters<typeof target.signOut>) => {
        proxyUser = null;
        return target.signOut(...args);
      };
    }

    const value = Reflect.get(target, property, receiver);
    return typeof value === 'function' ? value.bind(target) : value;
  },
});

// Expose the real client with only its Auth interface proxied. All database,
// storage, and other Supabase functionality remains unchanged.
export const supabase = new Proxy(client, {
  get(target, property, receiver) {
    if (property === 'auth') return authProxy;
    return Reflect.get(target, property, receiver);
  },
});
