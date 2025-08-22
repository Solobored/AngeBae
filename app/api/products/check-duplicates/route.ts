import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

interface ProductToCheck {
  name: string
  price: number
  description?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { products }: { products: ProductToCheck[] } = body

    if (!products || !Array.isArray(products)) {
      return NextResponse.json({ error: "Productos requeridos" }, { status: 400 })
    }

    // Obtener todos los productos existentes
    const { data: existingProducts, error } = await supabase
      .from("products")
      .select("id, name, price, slug")
      .eq("is_active", true)

    if (error) {
      console.error("Error fetching existing products:", error)
      return NextResponse.json({ error: "Error al verificar duplicados" }, { status: 500 })
    }

    // Función para normalizar nombres de productos
    const normalizeProductName = (name: string): string => {
      return name
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .replace(/\b(ml|gr|gramos|mililitros|unidades|piezas)\b/g, "")
        .replace(/\s+/g, " ")
        .trim()
    }

    // Función para calcular similitud entre strings
    const calculateSimilarity = (str1: string, str2: string): number => {
      const longer = str1.length > str2.length ? str1 : str2
      const shorter = str1.length > str2.length ? str2 : str1

      if (longer.length === 0) return 1.0

      const editDistance = levenshteinDistance(longer, shorter)
      return (longer.length - editDistance) / longer.length
    }

    // Función para calcular distancia de Levenshtein
    const levenshteinDistance = (str1: string, str2: string): number => {
      const matrix = []

      for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i]
      }

      for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j
      }

      for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
          if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
            matrix[i][j] = matrix[i - 1][j - 1]
          } else {
            matrix[i][j] = Math.min(
              matrix[i - 1][j - 1] + 1, // substitution
              matrix[i][j - 1] + 1, // insertion
              matrix[i - 1][j] + 1, // deletion
            )
          }
        }
      }

      return matrix[str2.length][str1.length]
    }

    // Verificar duplicados para cada producto
    const results = products.map((product) => {
      const normalizedName = normalizeProductName(product.name)
      let isDuplicate = false
      let duplicateInfo = null
      let confidence = 1.0

      // Buscar productos similares
      for (const existingProduct of existingProducts || []) {
        const existingNormalized = normalizeProductName(existingProduct.name)
        const nameSimilarity = calculateSimilarity(normalizedName, existingNormalized)

        // Verificar similitud de precio (dentro del 10%)
        const priceDifference = Math.abs(product.price - existingProduct.price)
        const priceThreshold = product.price * 0.1
        const priceSimilar = priceDifference <= priceThreshold

        // Considerar duplicado si el nombre es muy similar (>= 80%) y el precio es similar
        if (nameSimilarity >= 0.8 && priceSimilar) {
          isDuplicate = true
          confidence = Math.max(0.1, 1.0 - nameSimilarity) // Reducir confianza basado en similitud
          duplicateInfo = {
            existingProductId: existingProduct.id,
            existingProductName: existingProduct.name,
            existingProductPrice: existingProduct.price,
            nameSimilarity: Math.round(nameSimilarity * 100),
            priceDifference: Math.round(priceDifference),
          }
          break
        }
      }

      return {
        ...product,
        duplicate: isDuplicate,
        confidence,
        duplicateInfo,
      }
    })

    // Estadísticas
    const totalProducts = results.length
    const duplicateCount = results.filter((r) => r.duplicate).length
    const uniqueCount = totalProducts - duplicateCount

    return NextResponse.json({
      success: true,
      results,
      statistics: {
        total: totalProducts,
        unique: uniqueCount,
        duplicates: duplicateCount,
        duplicateRate: totalProducts > 0 ? Math.round((duplicateCount / totalProducts) * 100) : 0,
      },
    })
  } catch (error) {
    console.error("Error checking duplicates:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
