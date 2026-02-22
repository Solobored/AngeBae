import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Public admin routes (no auth required)
  const publicRoutes = ["/admin/login", "/admin/signup"]
  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"))

  // Check for admin authentication cookie
  const adminAuth = request.cookies.get("admin_auth")?.value

  // If accessing /admin directly (landing page), allow without auth
  if (pathname === "/admin") {
    return NextResponse.next()
  }

  // If it's a public route, allow without auth
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // For protected routes (like /admin/dashboard, /admin/catalog, etc.)
  if (pathname.startsWith("/admin/")) {
    if (!adminAuth) {
      // Redirect to admin login if not authenticated
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
