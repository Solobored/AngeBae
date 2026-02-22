import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcrypt"
import { z } from "zod"
import { querySingle } from "@/lib/db"
import { isProvidersFeatureEnabled, signProviderToken } from "@/lib/auth"

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export async function POST(request: NextRequest) {
  if (!isProvidersFeatureEnabled()) {
    return NextResponse.json({ error: "Providers feature disabled" }, { status: 503 })
  }

  try {
    const body = await request.json()
    const { email, password } = loginSchema.parse(body)

    const user = await querySingle<{
      id: string
      email: string
      password_hash: string
      name: string | null
    }>(`SELECT id::text AS id, email, password_hash, name FROM users WHERE email = $1`, [email])

    if (!user) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
    }

    const membership = await querySingle<{
      provider_id: string
      role: "owner" | "manager"
      slug: string
      name: string
    }>(
      `SELECT pu.provider_id::text AS provider_id, pu.role, p.slug, p.name
       FROM provider_users pu
       JOIN providers p ON p.id = pu.provider_id
       WHERE pu.user_id = $1
       ORDER BY CASE WHEN pu.role = 'owner' THEN 0 ELSE 1 END, pu.created_at ASC
       LIMIT 1`,
      [user.id],
    )

    if (!membership) {
      return NextResponse.json({ error: "El usuario no pertenece a ningún proveedor" }, { status: 403 })
    }

    const token = signProviderToken({
      userId: user.id,
      providerId: membership.provider_id,
      role: membership.role,
      email: user.email,
    })

    const response = NextResponse.json({
      provider: {
        id: membership.provider_id,
        slug: membership.slug,
        name: membership.name,
        role: membership.role,
      },
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    })

    response.cookies.set({
      name: "provider_auth",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24,
    })

    return response
  } catch (error) {
    if ((error as any)?.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }
    console.error("Provider login error:", error)
    return NextResponse.json({ error: "No se pudo iniciar sesión" }, { status: 500 })
  }
}
