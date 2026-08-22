// Supabase browser client
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

function createSupabaseClient() {
  const supabaseUrl =
    import.meta.env['VITE_SUPABASE_URL'] ||
    process.env['SUPABASE_URL'] ||
    'https://ilfwenfvgqpuronobsbq.supabase.co';

  const publishableKey =
    import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] ||
    process.env['SUPABASE_PUBLISHABLE_KEY'];

  if (!publishableKey) {
    const message =
      'Supabase is not configured for the browser. Add VITE_SUPABASE_PUBLISHABLE_KEY to the Vercel Production environment and redeploy.';
    console.error(`[Supabase] ${message}`);
    throw new Error(message);
  }

  // Use the official Supabase client request handling. Do not wrap fetch
  // manually because Supabase Auth manages the apikey and Authorization
  // headers independently during sign-in and session refresh.
  return createClient<Database>(supabaseUrl, publishableKey, {
    auth: {
      storage: typeof window !== 'undefined' ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

let _supabase: ReturnType<typeof createSupabaseClient> | undefined;

export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  },
});
