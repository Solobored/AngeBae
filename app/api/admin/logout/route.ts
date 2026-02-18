import { NextResponse } from "next/server";

/**
 * POST /api/admin/logout
 * Admin logout endpoint - clears authentication cookie
 */
export async function POST() {
  try {
    const response = NextResponse.json(
      { success: true, message: "Logged out successfully" },
      { status: 200 }
    );

    // Clear admin_auth cookie
    response.cookies.set({
      name: "admin_auth",
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0,
    });

    return response;
  } catch (err) {
    console.error("Admin logout error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
