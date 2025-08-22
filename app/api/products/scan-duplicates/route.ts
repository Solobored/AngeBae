import { type NextRequest, NextResponse } from "next/server"

interface ProductToScan {
  id: number
  name: string
  price: number
}

interface DuplicateGroup {
  products: ProductToScan[]
  similarity: number
  priceRange: { min: number; max: number }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { products, similarityThreshold = 0.8 }: { products: ProductToScan[]; similarityThreshold: number } = body

    if (!products || !Array.isArray(products)) {
      return NextResponse.json({ error: "Productos requeridos" }, { status: 400 })
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

    // Función para calcular similitud usando Jaccard similarity
    const calculateJaccardSimilarity = (str1: string, str2: string): number => {
      const set1 = new Set(str1.split(" "))
      const set2 = new Set(str2.split(" "))

      const intersection = new Set([...set1].filter((x) => set2.has(x)))
      const union = new Set([...set1, ...set2])

      return intersection.size / union.size
    }

    // Función para calcular similitud de Levenshtein
    const calculateLevenshteinSimilarity = (str1: string, str2: string): number => {
      const longer = str1.length > str2.length ? str1 : str2
      const shorter = str1.length > str2.length ? str2 : str1

      if (longer.length === 0) return 1.0

      const editDistance = levenshteinDistance(longer, shorter)
      return (longer.length - editDistance) / longer.length
    }

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

    // Encontrar grupos de productos similares
    const duplicateGroups: DuplicateGroup[] = []
    const processedProducts = new Set<number>()

    for (let i = 0; i < products.length; i++) {
      if (processedProducts.has(products[i].id)) continue

      const currentProduct = products[i]
      const normalizedName1 = normalizeProductName(currentProduct.name)
      const similarProducts = [currentProduct]

      for (let j = i + 1; j < products.length; j++) {
        if (processedProducts.has(products[j].id)) continue

        const compareProduct = products[j]
        const normalizedName2 = normalizeProductName(compareProduct.name)

        // Calcular similitud combinada (Jaccard + Levenshtein)
        const jaccardSim = calculateJaccardSimilarity(normalizedName1, normalizedName2)
        const levenshteinSim = calculateLevenshteinSimilarity(normalizedName1, normalizedName2)
        const combinedSimilarity = (jaccardSim + levenshteinSim) / 2

        // Verificar similitud de precio (dentro del 15%)
        const priceDifference = Math.abs(currentProduct.price - compareProduct.price)
        const priceThreshold = Math.max(currentProduct.price, compareProduct.price) * 0.15
        const priceSimilar = priceDifference <= priceThreshold

        // Considerar similar si cumple el umbral de similitud y el precio es similar
        if (combinedSimilarity >= similarityThreshold && priceSimilar) {
          similarProducts.push(compareProduct)
          processedProducts.add(compareProduct.id)
        }
      }

      // Si encontramos productos similares, crear un grupo
      if (similarProducts.length > 1) {
        const prices = similarProducts.map((p) => p.price)
        const avgSimilarity = similarProducts.length > 1 ? similarityThreshold * 100 : 100

        duplicateGroups.push({
          products: similarProducts,
          similarity: avgSimilarity,
          priceRange: {
            min: Math.min(...prices),
            max: Math.max(...prices),
          },
        })

        // Marcar todos los productos del grupo como procesados
        similarProducts.forEach((p) => processedProducts.add(p.id))
      }
    }

    // Ordenar grupos por similitud (más similares primero)
    duplicateGroups.sort((a, b) => b.similarity - a.similarity)

    // Estadísticas
    const totalDuplicates = duplicateGroups.reduce((acc, group) => acc + group.products.length - 1, 0)
    const uniqueProducts = products.length - totalDuplicates

    return NextResponse.json({
      success: true,
      duplicateGroups,
      statistics: {
        totalProducts: products.length,
        duplicateGroups: duplicateGroups.length,
        totalDuplicates,
        uniqueProducts,
        duplicateRate: products.length > 0 ? Math.round((totalDuplicates / products.length) * 100) : 0,
      },
    })
  } catch (error) {
    console.error("Error scanning for duplicates:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
