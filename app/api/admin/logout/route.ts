import { NextResponse } from "next/server";

export async function POST() {
  try {
    // For a simple logout, you can clear any client-side tokens or session info.
    // If you use cookies or JWT, clear them here.
    return NextResponse.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Admin logout error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
