"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Client-side Supabase instance for client components.
 * Uses public env vars (NEXT_PUBLIC_*) and stores the session in cookies.
 */
export const supabaseClient = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
