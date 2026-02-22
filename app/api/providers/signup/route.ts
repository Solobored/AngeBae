import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcrypt"
import { z } from "zod"
import nodemailer from "nodemailer"
import { getPool } from "@/lib/db"
import { isProvidersFeatureEnabled, signProviderToken } from "@/lib/auth"

export const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  contact_info: z.record(z.any()).optional(),
})

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}

async function ensureUniqueSlug(base: string, client: any): Promise<string> {
  let candidate = base
  let attempt = 0
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists = await client.query("SELECT 1 FROM providers WHERE slug = $1", [candidate])
    if (exists.rowCount === 0) return candidate
    attempt += 1
    candidate = `${base}-${attempt}`
  }
}

async function sendVerificationEmail(email: string, name: string) {
  try {
    const host = process.env.SMTP_HOST || "localhost"
    const port = Number(process.env.SMTP_PORT || 1025)
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: false,
    })

    await transporter.sendMail({
      from: "no-reply@beauty-therapist.local",
      to: email,
      subject: "Verifica tu cuenta de proveedor",
      text: `Hola ${name},\n\nGracias por registrarte en Beauty Therapist. Tu cuenta de proveedor está creada.\n\n`,
    })
  } catch (err) {
    console.warn("Verification email failed (continuing):", (err as Error).message)
  }
}

export async function POST(request: NextRequest) {
  if (!isProvidersFeatureEnabled()) {
    return NextResponse.json({ error: "Providers feature disabled" }, { status: 503 })
  }

  const pool = getPool()
  const client = await pool.connect()

  try {
    const body = await request.json()
    const parsed = signupSchema.parse(body)

    const existingUser = await client.query("SELECT id FROM users WHERE email = $1", [parsed.email])
    if (existingUser.rowCount > 0) {
      return NextResponse.json({ error: "Email ya registrado" }, { status: 409 })
    }

    await client.query("BEGIN")

    const passwordHash = await bcrypt.hash(parsed.password, 10)
    const userResult = await client.query<{ id: string }>(
      `INSERT INTO users (email, password_hash, name, is_verified, created_at, updated_at)
       VALUES ($1, $2, $3, false, now(), now())
       RETURNING id::text AS id`,
      [parsed.email, passwordHash, parsed.name],
    )
    const userId = userResult.rows[0].id

    const baseSlug = slugify(parsed.name || "provider")
    const slug = await ensureUniqueSlug(baseSlug, client)

    const providerResult = await client.query<{ id: string; slug: string }>(
      `INSERT INTO providers (owner_user_id, name, slug, description, contact_info, is_published, created_at, updated_at)
       VALUES ($1, $2, $3, NULL, $4::jsonb, false, now(), now())
       RETURNING id::text AS id, slug`,
      [userId, parsed.name, slug, JSON.stringify(parsed.contact_info || {})],
    )
    const providerId = providerResult.rows[0].id

    await client.query(
      `INSERT INTO provider_users (provider_id, user_id, role, created_at)
       VALUES ($1, $2, 'owner', now())
       ON CONFLICT (provider_id, user_id) DO NOTHING`,
      [providerId, userId],
    )

    await client.query(
      `INSERT INTO brand_settings (provider_id, logo_url, site_title, subtitle, colors, created_at, updated_at)
       VALUES ($1, '', $2, 'Parte de Beauty Therapist', '{}'::jsonb, now(), now())
       ON CONFLICT (provider_id) DO NOTHING`,
      [providerId, parsed.name],
    )

    await client.query("COMMIT")

    await sendVerificationEmail(parsed.email, parsed.name)

    const token = signProviderToken({
      userId,
      providerId,
      role: "owner",
      email: parsed.email,
    })

    const response = NextResponse.json(
      {
        provider: {
          id: providerId,
          name: parsed.name,
          slug,
        },
      },
      { status: 201 },
    )

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
    await client.query("ROLLBACK")
    console.error("Provider signup error:", error)
    if ((error as any)?.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }
    return NextResponse.json({ error: "No se pudo crear el proveedor" }, { status: 500 })
  } finally {
    client.release()
  }
}
