// Smart search utility for semantic product matching
export interface ProductKeywords {
  [key: string]: string[]
}

export const productKeywords: ProductKeywords = {
  // Sun protection related
  sol: ["protector solar", "bloqueador", "fps", "protección solar", "uv"],
  solar: ["protector solar", "bloqueador", "fps", "protección solar", "uv"],
  protector: ["protector solar", "bloqueador", "fps", "protección solar", "uv"],
  bloqueador: ["protector solar", "bloqueador", "fps", "protección solar", "uv"],

  // Eye care related
  ojos: ["contorno de ojos", "crema para ojos", "ojeras", "bolsas", "pestañas", "cejas"],
  ojeras: ["contorno de ojos", "crema para ojos", "ojeras", "bolsas"],
  pestañas: ["máscara", "rimel", "pestañas", "cejas", "serum pestañas"],
  cejas: ["gel de cejas", "lápiz de cejas", "cejas", "pestañas"],

  // Acne and skin problems
  acne: ["acné", "espinillas", "puntos negros", "granos", "imperfecciones"],
  espinillas: ["acné", "espinillas", "puntos negros", "granos", "imperfecciones"],
  granos: ["acné", "espinillas", "puntos negros", "granos", "imperfecciones"],

  // Hydration
  hidratacion: ["crema hidratante", "hidratación", "piel seca", "humectante"],
  seca: ["crema hidratante", "hidratación", "piel seca", "humectante"],

  // Anti-aging
  arrugas: ["anti-edad", "antiarrugas", "lifting", "firmeza", "colágeno"],
  edad: ["anti-edad", "antiarrugas", "lifting", "firmeza", "colágeno"],

  // Cleansing
  limpieza: ["limpiador", "gel limpiador", "espuma", "desmaquillante"],
  limpiador: ["limpiador", "gel limpiador", "espuma", "desmaquillante"],

  // Sensitive skin
  sensible: ["piel sensible", "hipoalergénico", "suave", "delicado"],

  // Vitamins and ingredients
  vitamina: ["vitamina c", "vitamina e", "antioxidante", "serum"],
  acido: ["ácido hialurónico", "ácido salicílico", "ácido glicólico"],

  // Skin types
  grasa: ["piel grasa", "control grasa", "matificante", "poros"],
  mixta: ["piel mixta", "zona t", "combinada"],

  // Body parts
  labios: ["bálsamo labial", "labios", "lip balm", "brillo labial"],
  manos: ["crema de manos", "manos", "uñas"],
  cuerpo: ["crema corporal", "loción corporal", "body"],
}

export function getSmartSearchTerms(query: string): string[] {
  const normalizedQuery = query.toLowerCase().trim()
  const searchTerms = new Set<string>()

  // Add the original query
  searchTerms.add(normalizedQuery)

  // Check for keyword matches
  Object.entries(productKeywords).forEach(([keyword, relatedTerms]) => {
    if (normalizedQuery.includes(keyword)) {
      relatedTerms.forEach((term) => searchTerms.add(term))
    }
  })

  // Handle partial matches
  const words = normalizedQuery.split(" ")
  words.forEach((word) => {
    Object.entries(productKeywords).forEach(([keyword, relatedTerms]) => {
      if (keyword.includes(word) || word.includes(keyword)) {
        relatedTerms.forEach((term) => searchTerms.add(term))
      }
    })
  })

  return Array.from(searchTerms)
}

export function smartProductFilter(products: any[], searchTerm: string) {
  if (!searchTerm.trim()) return products

  const searchTerms = getSmartSearchTerms(searchTerm)

  return products.filter((product) => {
    const searchableText = `${product.name} ${product.description} ${product.category}`.toLowerCase()

    return searchTerms.some((term) => searchableText.includes(term.toLowerCase()))
  })
}
