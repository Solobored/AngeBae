import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcrypt"
import { querySingle, query } from "@/lib/db"
import { generateToken } from "@/lib/auth"

interface UserRow {
  id: string
  email: string
  name?: string
  password_hash: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Check if user exists
    let user = await querySingle<UserRow>(
      "SELECT id, email, password_hash, name FROM users WHERE email = $1",
      [email],
    )

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash)
    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Generate token (use a simple JWT-like approach, similar to admin)
    const token = generateToken({ id: user.id, email: user.email, type: "user" })

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    })

    response.cookies.set({
      name: "user_auth",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error) {
    console.error("User login error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
