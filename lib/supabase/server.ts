import { createClient } from "@supabase/supabase-js";

/**
 * Synchronous Supabase client for server-side usage.
 * Uses the service role key for full server access.
 */
export function createServerSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
