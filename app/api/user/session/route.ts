import { NextRequest, NextResponse } from "next/server"
import { verifyTokenWithType } from "@/lib/auth"

interface TokenPayload {
  id: string
  email: string
  type: string
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("user_auth")?.value

    if (!token) {
      return NextResponse.json({ authenticated: false })
    }

    const decoded = verifyTokenWithType(token, "user") as TokenPayload | null

    if (!decoded) {
      return NextResponse.json({ authenticated: false })
    }

    // In a real app, you'd fetch the user from the database here
    // For now, we'll return the basic info from the token
    return NextResponse.json({
      authenticated: true,
      user: {
        id: decoded.id,
        email: decoded.email,
      },
    })
  } catch (error) {
    console.error("Session check error:", error)
    return NextResponse.json({ authenticated: false })
  }
}
