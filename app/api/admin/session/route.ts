import { NextRequest, NextResponse } from "next/server"
import { getAdminSessionFromRequest } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminSessionFromRequest(request)
    if (!admin) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    return NextResponse.json({
      authenticated: true,
      admin,
    })
  } catch (error) {
    console.error("Admin session error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
