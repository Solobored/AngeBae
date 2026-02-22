import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcrypt"
import { querySingle, query } from "@/lib/db"
import { generateToken } from "@/lib/auth"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name } = body

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await querySingle("SELECT id FROM users WHERE email = $1", [email])

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)
    const userId = uuidv4()

    // Create user
    await query(
      `INSERT INTO users (id, email, password_hash, name, created_at) 
       VALUES ($1, $2, $3, $4, NOW())`,
      [userId, email, hashedPassword, name || null],
    )

    // Generate token
    const token = generateToken({ id: userId, email, type: "user" })

    const response = NextResponse.json({
      user: {
        id: userId,
        email,
        name: name || null,
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
    console.error("User signup error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
