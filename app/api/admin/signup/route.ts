import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcrypt"
import { query } from "@/lib/db"
import { signAdminToken } from "@/lib/auth"

interface SignupBody {
  name?: string
  email: string
  password: string
  confirmPassword: string
}

interface AdminRow {
  id: string
  email: string
  name: string | null
}

export async function POST(request: NextRequest) {
  try {
    const body: SignupBody = await request.json()
    const { name, email, password, confirmPassword } = body

    // Validation
    if (!email || !password || !confirmPassword) {
      return NextResponse.json({ error: "Email y contraseña son requeridos" }, { status: 400 })
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Las contraseñas no coinciden" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 },
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 })
    }

    // Check if admin already exists
    const existingAdmin = await query<AdminRow>(
      "SELECT id FROM admins WHERE email = $1",
      [email.toLowerCase()],
    )

    if (existingAdmin && existingAdmin.length > 0) {
      return NextResponse.json(
        { error: "Este email ya está registrado" },
        { status: 400 },
      )
    }

    // Hash password
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create admin
    const result = await query<AdminRow>(
      "INSERT INTO admins (email, password, name, active) VALUES ($1, $2, $3, $4) RETURNING id, email, name",
      [email.toLowerCase(), hashedPassword, name || null, true],
    )

    if (!result || result.length === 0) {
      return NextResponse.json(
        { error: "Error al crear la cuenta" },
        { status: 500 },
      )
    }

    const admin = result[0]
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
    console.error("Admin signup error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
