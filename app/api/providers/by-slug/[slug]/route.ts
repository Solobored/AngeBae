import { NextRequest, NextResponse } from "next/server"
import { query, querySingle } from "@/lib/db"
import { isProvidersFeatureEnabled } from "@/lib/auth"

export async function GET(_request: NextRequest, { params }: { params: { slug: string } }) {
  if (!isProvidersFeatureEnabled()) {
    return NextResponse.json({ error: "Providers feature disabled" }, { status: 503 })
  }

  const slug = params.slug

  const provider = await querySingle<{
    id: string
    name: string
    slug: string
    description: string | null
    logo_url: string | null
    banner_url: string | null
    favicon_url: string | null
    theme: unknown
    contact_info: unknown
    is_published: boolean
    brand_logo_url: string | null
    brand_favicon_url: string | null
    brand_banner_url: string | null
    brand_site_title: string | null
    brand_subtitle: string | null
    brand_colors: unknown
  }>(
    `SELECT
       p.id::text,
       p.name,
       p.slug,
       p.description,
       p.logo_url,
       p.banner_url,
       p.favicon_url,
       p.theme,
       p.contact_info,
       p.is_published,
       bs.logo_url AS brand_logo_url,
       bs.favicon_url AS brand_favicon_url,
       bs.banner_url AS brand_banner_url,
       bs.site_title AS brand_site_title,
       bs.subtitle AS brand_subtitle,
       bs.colors AS brand_colors
     FROM providers p
     LEFT JOIN brand_settings bs ON bs.provider_id = p.id
     WHERE p.slug = $1`,
    [slug],
  )

  if (!provider) {
    return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 })
  }

  const products = await query<{
    id: string
    title: string
    description: string | null
    main_image_url: string | null
    is_flash_sale: boolean
    is_best_seller: boolean
    active: boolean
    price: number
    original_price: number | null
  }>(
    `SELECT
       p.id::text AS id,
       p.title,
       p.description,
       p.main_image_url,
       p.is_flash_sale,
       p.is_best_seller,
       p.active,
       COALESCE(v.price_numeric, 0)::float8 AS price,
       v.original_price_numeric::float8 AS original_price
     FROM products p
     LEFT JOIN LATERAL (
       SELECT price_numeric, original_price_numeric
       FROM product_variants
       WHERE product_id = p.id AND active = true
       ORDER BY created_at ASC
       LIMIT 1
     ) v ON true
     WHERE p.provider_id = $1 AND p.active = true
     ORDER BY p.created_at DESC
     LIMIT 12`,
    [provider.id],
  )

  return NextResponse.json({
    id: provider.id,
    name: provider.name,
    slug: provider.slug,
    description: provider.description,
    logo_url: provider.logo_url ?? provider.brand_logo_url,
    banner_url: provider.banner_url ?? provider.brand_banner_url,
    favicon_url: provider.favicon_url ?? provider.brand_favicon_url,
    theme: provider.theme,
    contact_info: provider.contact_info,
    is_published: provider.is_published,
    brand_settings: {
      logo_url: provider.brand_logo_url,
      favicon_url: provider.brand_favicon_url,
      banner_url: provider.brand_banner_url,
      site_title: provider.brand_site_title,
      subtitle: provider.brand_subtitle,
      colors: provider.brand_colors,
    },
    featured_products: products.map((p) => ({
      id: p.id,
      name: p.title,
      description: p.description,
      image_url: p.main_image_url,
      is_flash_sale: p.is_flash_sale,
      is_best_seller: p.is_best_seller,
      price: p.price,
      original_price: p.original_price,
    })),
  })
}
