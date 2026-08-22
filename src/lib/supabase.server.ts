import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client.
 * Supports the newer secret key as well as the legacy service-role key.
 */
export function supabaseAdmin(): SupabaseClient {
  const configuredUrl = process.env.SUPABASE_URL?.trim();
  const url = configuredUrl && configuredUrl.includes("iifwenfvggpurohobsbq")
    ? configuredUrl
    : "https://iifwenfvggpurohobsbq.supabase.co";

  const key = process.env.SUPABASE_SECRET_KEY
    || process.env.SUPABASE_SERVICE_ROLE_KEY
    || process.env.SUPABASE_ROLE_KEY;

  if (!key) {
    throw new Error("Missing Supabase server key. Set SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY in Vercel.");
  }

  // A publishable/anon key cannot be used for trusted server-side order writes.
  if (key.startsWith("sb_publishable_")) {
    throw new Error("The Supabase server key is a publishable key. Use the Secret key (sb_secret_...) in SUPABASE_SECRET_KEY, or the legacy service_role key.");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

/** Returns true when the deployed Supabase server environment is configured. */
export function supabaseEnabled(): boolean {
  return Boolean(
    process.env.SUPABASE_SECRET_KEY
    || process.env.SUPABASE_SERVICE_ROLE_KEY
    || process.env.SUPABASE_ROLE_KEY,
  );
}
