import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcrypt"
import { querySingle } from "@/lib/db"
import { signAdminToken } from "@/lib/auth"

interface AdminRow {
  id: string
  email: string
  password: string
  name: string | null
  active: boolean
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const admin = await querySingle<AdminRow>(
      "SELECT id, email, password, name, active FROM admins WHERE email = $1",
      [email],
    )

    if (!admin || !admin.active) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const isValid = await bcrypt.compare(password, admin.password)

    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const token = signAdminToken({ id: admin.id, email: admin.email })

    const response = NextResponse.json({
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
    })

    response.cookies.set({
      name: "admin_auth",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24,
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Admin login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
