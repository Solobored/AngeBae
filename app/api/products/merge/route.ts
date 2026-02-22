import { NextRequest, NextResponse } from "next/server"
import { getAdminSessionFromRequest } from "@/lib/auth"
import { getPool } from "@/lib/db"

interface ProductForMerge {
  id: string
  name: string
  description: string | null
  stock: number
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
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
    const { keepProductId, removeProductIds } = body as {
      keepProductId: string
      removeProductIds: string[]
    }

    if (!keepProductId || !Array.isArray(removeProductIds) || removeProductIds.length === 0) {
      return NextResponse.json({ error: "IDs de productos requeridos" }, { status: 400 })
    }

    if (!isUuid(keepProductId) || removeProductIds.some((id) => !isUuid(id))) {
      return NextResponse.json({ error: "Uno o más IDs de producto son inválidos" }, { status: 400 })
    }

    if (removeProductIds.includes(keepProductId)) {
      return NextResponse.json({ error: "El producto principal no puede estar en la lista de eliminación" }, { status: 400 })
    }

    await client.query("BEGIN")

    const keepResult = await client.query<ProductForMerge>(
      `SELECT
         p.id::text AS id,
         p.title AS name,
         p.description,
         COALESCE(v.stock_int, 0)::int AS stock
       FROM products p
       LEFT JOIN LATERAL (
         SELECT stock_int
         FROM product_variants
         WHERE product_id = p.id AND active = true
         ORDER BY created_at ASC
         LIMIT 1
       ) v ON true
       WHERE p.id = $1::uuid AND p.active = true`,
      [keepProductId],
    )

    const keepProduct = keepResult.rows[0]
    if (!keepProduct) {
      await client.query("ROLLBACK")
      return NextResponse.json({ error: "Producto principal no encontrado" }, { status: 404 })
    }

    const removeResult = await client.query<ProductForMerge>(
      `SELECT
         p.id::text AS id,
         p.title AS name,
         p.description,
         COALESCE(v.stock_int, 0)::int AS stock
       FROM products p
       LEFT JOIN LATERAL (
         SELECT stock_int
         FROM product_variants
         WHERE product_id = p.id AND active = true
         ORDER BY created_at ASC
         LIMIT 1
       ) v ON true
       WHERE p.id = ANY($1::uuid[]) AND p.active = true`,
      [removeProductIds],
    )

    if (removeResult.rows.length === 0) {
      await client.query("ROLLBACK")
      return NextResponse.json({ error: "No se encontraron productos a fusionar" }, { status: 404 })
    }

    let combinedStock = keepProduct.stock
    let combinedDescription = keepProduct.description || ""

    for (const product of removeResult.rows) {
      combinedStock += product.stock
      if (product.description && !combinedDescription.includes(product.description)) {
        combinedDescription = combinedDescription
          ? `${combinedDescription}\n\n${product.description}`
          : product.description
      }
    }

    await client.query(
      `UPDATE products
       SET description = $1,
           updated_at = NOW()
       WHERE id = $2::uuid`,
      [combinedDescription || null, keepProductId],
    )

    const keepVariant = await client.query<{ id: string }>(
      `SELECT id::text AS id
       FROM product_variants
       WHERE product_id = $1::uuid AND active = true
       ORDER BY created_at ASC
       LIMIT 1`,
      [keepProductId],
    )

    if (keepVariant.rows[0]) {
      await client.query(
        `UPDATE product_variants
         SET stock_int = $1,
             updated_at = NOW()
         WHERE id = $2::uuid`,
        [combinedStock, keepVariant.rows[0].id],
      )
    } else {
      await client.query(
        `INSERT INTO product_variants (product_id, stock_int, active, created_at, updated_at)
         VALUES ($1::uuid, $2, true, NOW(), NOW())`,
        [keepProductId, combinedStock],
      )
    }

    await client.query(
      `UPDATE products
       SET active = false,
           updated_at = NOW()
       WHERE id = ANY($1::uuid[])`,
      [removeProductIds],
    )

    await client.query(
      `UPDATE product_variants
       SET active = false,
           updated_at = NOW()
       WHERE product_id = ANY($1::uuid[])`,
      [removeProductIds],
    )

    await client.query("COMMIT")

    return NextResponse.json({
      success: true,
      message: `Productos fusionados exitosamente. Stock combinado: ${combinedStock}`,
      mergedProduct: {
        id: keepProductId,
        name: keepProduct.name,
        stock: combinedStock,
        description: combinedDescription,
      },
      removedCount: removeResult.rows.length,
    })
  } catch (error) {
    await client.query("ROLLBACK")
    console.error("Error merging products:", error)
    return NextResponse.json({ error: "Error al fusionar productos" }, { status: 500 })
  } finally {
    client.release()
  }
}
