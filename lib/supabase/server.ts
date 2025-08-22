import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies, type ReadonlyRequestCookies } from "next/headers";

/**
 * Creates a Supabase client for server-side usage (Server Components, Server Actions)
 * Handles cookies properly with Next.js 15 types.
 */
export function createServerSupabaseClient() {
  const cookieStore: ReadonlyRequestCookies = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // get cookie value safely
          return cookieStore.get(name)?.value ?? undefined;
        },
        set(name: string, value: string, options: CookieOptions) {
          // set cookie using Next.js cookies API
          cookies().set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          // delete cookie
          cookies().delete({ name, ...options });
        },
      },
    }
  );
}
