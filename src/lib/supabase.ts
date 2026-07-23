import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _admin: SupabaseClient | null = null;

function getAdmin(): SupabaseClient {
  if (_admin) return _admin;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase env vars (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) not set");
  }
  _admin = createClient(url, key, { auth: { persistSession: false } });
  return _admin;
}

// Lazy helper: only creates the client when first accessed
export function supabaseAdmin(): SupabaseClient {
  return getAdmin();
}
