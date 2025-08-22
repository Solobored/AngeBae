import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

/**
 * This middleware:
 * 1) Keeps the Supabase session fresh for SSR
 * 2) Protects /admin/** routes (redirects to /admin/login if not signed in)
 *
 * Adjust matchers at the bottom if you need to protect more paths.
 */

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // IMPORTANT: set cookie on the response so browser stores updates
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          res.cookies.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    }
  );

  // Refresh session if needed (keeps RSC consistent)
  await supabase.auth.getSession();

  const url = new URL(req.url);
  const isAdmin = url.pathname.startsWith("/admin");
  const isLogin = url.pathname === "/admin/login";

  if (isAdmin && !isLogin) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const redirectUrl = new URL("/admin/login", req.url);
      // Optional: return URL to come back post-login
      redirectUrl.searchParams.set("redirect", url.pathname + url.search);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return res;
}

// Only run on these paths (adjust as needed)
export const config = {
  matcher: ["/admin/:path*"],
};
