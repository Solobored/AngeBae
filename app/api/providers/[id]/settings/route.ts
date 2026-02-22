import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAdminSessionFromRequest, getProviderSessionFromRequest, isProvidersFeatureEnabled } from "@/lib/auth"
import { getPool } from "@/lib/db"

const settingsSchema = z.object({
  name: z.string().min(2).optional(),
  logo_url: z.string().url().optional(),
  banner_url: z.string().url().optional(),
  favicon_url: z.string().url().optional(),
  theme: z.record(z.any()).optional(),
  contact_info: z.record(z.any()).optional(),
  is_published: z.boolean().optional(),
  brand: z
    .object({
      logo_url: z.string().url().optional(),
      favicon_url: z.string().url().optional(),
      banner_url: z.string().url().optional(),
      site_title: z.string().optional(),
      subtitle: z.string().optional(),
      colors: z.record(z.any()).optional(),
    })
    .optional(),
})

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  if (!isProvidersFeatureEnabled()) {
    return NextResponse.json({ error: "Providers feature disabled" }, { status: 503 })
  }

  const providerId = params.id
  const admin = await getAdminSessionFromRequest(request)
  const providerSession = await getProviderSessionFromRequest(request)

  if (!admin && (!providerSession || providerSession.providerId !== providerId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const pool = getPool()
  const client = await pool.connect()

  try {
    const body = await request.json()
    const parsed = settingsSchema.parse(body)

    await client.query("BEGIN")

    const updates: string[] = []
    const values: unknown[] = []
    let idx = 1

    const fields: Array<[keyof typeof parsed, string]> = [
      ["name", "name"],
      ["logo_url", "logo_url"],
      ["banner_url", "banner_url"],
      ["favicon_url", "favicon_url"],
      ["theme", "theme"],
      ["contact_info", "contact_info"],
      ["is_published", "is_published"],
    ]

    for (const [key, column] of fields) {
      const value = parsed[key]
      if (value !== undefined) {
        updates.push(`${column} = $${idx}`)
        values.push(value)
        idx += 1
      }
    }

    if (updates.length > 0) {
      values.push(providerId)
      await client.query(`UPDATE providers SET ${updates.join(", ")}, updated_at = now() WHERE id = $${idx}`, values)
    }

    if (parsed.brand) {
      const b = parsed.brand
      await client.query(
        `INSERT INTO brand_settings (provider_id, logo_url, favicon_url, banner_url, site_title, subtitle, colors, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, now(), now())
         ON CONFLICT (provider_id) DO UPDATE SET
           logo_url = COALESCE(EXCLUDED.logo_url, brand_settings.logo_url),
           favicon_url = COALESCE(EXCLUDED.favicon_url, brand_settings.favicon_url),
           banner_url = COALESCE(EXCLUDED.banner_url, brand_settings.banner_url),
           site_title = COALESCE(EXCLUDED.site_title, brand_settings.site_title),
           subtitle = COALESCE(EXCLUDED.subtitle, brand_settings.subtitle),
           colors = COALESCE(EXCLUDED.colors, brand_settings.colors),
           updated_at = now()`,
        [
          providerId,
          b.logo_url ?? null,
          b.favicon_url ?? null,
          b.banner_url ?? null,
          b.site_title ?? null,
          b.subtitle ?? null,
          b.colors ? JSON.stringify(b.colors) : null,
        ],
      )
    }

    await client.query("COMMIT")
    return NextResponse.json({ success: true })
  } catch (error) {
    await client.query("ROLLBACK")
    console.error("Provider settings error:", error)
    if ((error as any)?.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }
    return NextResponse.json({ error: "No se pudieron actualizar los ajustes" }, { status: 500 })
  } finally {
    client.release()
  }
}
