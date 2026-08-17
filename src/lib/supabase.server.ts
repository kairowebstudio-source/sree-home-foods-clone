import { supabaseAdmin as generatedAdmin } from "@/integrations/supabase/client.server";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase access for this project.
 * Uses the Lovable Cloud generated admin client (service role, bypasses RLS).
 */
export function supabaseAdmin(): SupabaseClient {
  return generatedAdmin as unknown as SupabaseClient;
}

/** Returns true if the backend env vars are configured */
export function supabaseEnabled(): boolean {
  return !!(process.env['SUPABASE_URL'] && process.env['SUPABASE_SERVICE_ROLE_KEY']);
}
