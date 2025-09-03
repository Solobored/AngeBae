// lib/supabase/client.ts
import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client for browser usage
 * Uses the anon key (safe for client-side)
 */
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
