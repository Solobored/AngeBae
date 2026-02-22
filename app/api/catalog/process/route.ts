import { NextRequest, NextResponse } from "next/server"
import { existsSync, readdirSync } from "fs"
import { join } from "path"
import { getAdminSessionFromRequest } from "@/lib/auth"
import { getPool, query } from "@/lib/db"

interface MockProduct {
  name: string
  description: string
  price: number
  original_price?: number
  category: string
  confidence: number
  duplicate?: boolean
}

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function seededRandom(seed: number) {
  let state = seed % 2147483647
  if (state <= 0) {
    state += 2147483646
  }

  return () => {
    state = (state * 16807) % 2147483647
    return (state - 1) / 2147483646
  }
}

function getFilenameForFileId(fileId: string): string {
  const uploadsDir = join(process.cwd(), "uploads")
  if (!existsSync(uploadsDir)) {
    return `${fileId}.pdf`
  }

  const timestampHint = fileId.replace("pdf_", "")
  const file = readdirSync(uploadsDir).find((entry) => entry.includes(timestampHint))
  return file || `${fileId}.pdf`
}

function buildMockProducts(fileId: string): MockProduct[] {
  const productNames = [
    "Serum Vitamina C",
    "Crema Hidratante Facial",
    "Protector Solar FPS 50",
    "Limpiador Suave Espumoso",
    "Contorno de Ojos Reafirmante",
    "Exfoliante Enzimático",
    "Tónico Equilibrante",
    "Mascarilla de Arcilla",
    "Ácido Hialurónico 2%",
    "Niacinamida Concentrada",
    "Gel Calmante Aloe Vera",
    "Aceite Limpiador",
  ]
  const categories = ["serums", "cremas", "proteccion", "limpiadores", "tratamientos", "tonicos"]
  const random = seededRandom(hashString(fileId))

  const count = 6 + Math.floor(random() * 5)
  const results: MockProduct[] = []

  for (let i = 0; i < count; i += 1) {
    const name = productNames[Math.floor(random() * productNames.length)]
    const price = Math.round((1200 + random() * 4200) / 10) * 10
    const hasOriginal = random() > 0.45
    const originalPrice = hasOriginal ? Math.round(price * (1.12 + random() * 0.28)) : undefined

    results.push({
      name: `${name} ${i + 1}`,
      description: `${name} formulado para rutina diaria de cuidado facial.`,
      price,
      original_price: originalPrice,
      category: categories[Math.floor(random() * categories.length)],
      confidence: Number((0.72 + random() * 0.26).toFixed(2)),
    })
  }

  return results
}

export async function POST(request: NextRequest) {
  const pool = getPool()
  const client = await pool.connect()

  try {
    const admin = await getAdminSessionFromRequest(request)
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { fileId } = body as { fileId?: string }

    if (!fileId) {
      return NextResponse.json({ error: "File ID requerido" }, { status: 400 })
    }

    const filename = getFilenameForFileId(fileId)
    const products = buildMockProducts(fileId)
    const existingProducts = await query<{ title: string }>("SELECT title FROM products WHERE active = true")
    const titleSet = new Set(existingProducts.map((item) => item.title.toLowerCase().trim()))

    const enrichedProducts = products.map((product) => ({
      ...product,
      duplicate: titleSet.has(product.name.toLowerCase().trim()),
    }))

    await client.query("BEGIN")

    const runResult = await client.query<{ id: string; created_at: string }>(
      `INSERT INTO catalog_processing_runs (file_id, filename, status, created_at, updated_at)
       VALUES ($1, $2, 'completed', NOW(), NOW())
       RETURNING id::text AS id, created_at`,
      [fileId, filename],
    )

    const run = runResult.rows[0]

    for (const product of enrichedProducts) {
      await client.query(
        `INSERT INTO catalog_processing_products (
           run_id,
           name,
           description,
           price,
           original_price,
           category,
           confidence,
           duplicate,
           created_at
         )
         VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, NOW())`,
        [
          run.id,
          product.name,
          product.description,
          product.price,
          product.original_price || null,
          product.category,
          product.confidence,
          Boolean(product.duplicate),
        ],
      )
    }

    await client.query("COMMIT")

    return NextResponse.json({
      id: run.id,
      fileId,
      filename,
      status: "completed",
      products: enrichedProducts,
      created_at: run.created_at,
    })
  } catch (error) {
    await client.query("ROLLBACK")
    console.error("Error processing catalog:", error)
    return NextResponse.json({ error: "Error al procesar el PDF" }, { status: 500 })
  } finally {
    client.release()
  }
}
