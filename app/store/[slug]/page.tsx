"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Header } from "@/src/components/layout/Header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Store, ArrowLeft } from "lucide-react"
import { VideoSection } from "@/src/components/store/VideoSection"

type ProviderData = {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  banner_url: string | null
  brand_settings?: { site_title?: string; subtitle?: string }
  featured_products: Array<{
    id: string
    name: string
    description: string | null
    image_url: string | null
    price: number
    original_price: number | null
    is_flash_sale?: boolean
    is_best_seller?: boolean
  }>
}

export default function StoreSlugPage() {
  const params = useParams()
  const slug = typeof params.slug === "string" ? params.slug : ""
  const [provider, setProvider] = useState<ProviderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    if (!slug) {
      setLoading(false)
      return
    }
    fetch(`/api/providers/by-slug/${slug}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setProvider(data))
      .catch(() => setProvider(null))
      .finally(() => setLoading(false))
  }, [slug])

  useEffect(() => {
    const raw = localStorage.getItem("cart")
    if (raw) {
      try {
        const cart = JSON.parse(raw)
        const count = Array.isArray(cart) ? cart.reduce((s: number, i: { quantity?: number }) => s + (i.quantity ?? 1), 0) : 0
        setCartCount(count)
      } catch {
        setCartCount(0)
      }
    }
  }, [])

  const brand = provider
    ? {
        logoUrl: provider.logo_url ?? undefined,
        siteTitle: provider.brand_settings?.site_title ?? provider.name,
        subtitle: provider.brand_settings?.subtitle ?? "Parte de Beauty Therapist",
      }
    : undefined

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Cargando tienda...</div>
      </div>
    )
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Proveedor no encontrado</h2>
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al inicio
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const products = provider.featured_products || []

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/50 to-white">
      <Header
        searchTerm=""
        onSearchChange={() => {}}
        cartItemsCount={cartCount}
        brand={brand}
      />

      {/* Hero / Banner */}
      <section className="relative bg-gradient-to-r from-pink-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center text-white/90 hover:text-white text-sm mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al inicio
          </Link>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {provider.logo_url && (
              <div className="flex-shrink-0">
                <Image
                  src={provider.logo_url}
                  alt={provider.name}
                  width={96}
                  height={96}
                  className="rounded-2xl object-cover border-2 border-white/30 shadow-lg"
                />
              </div>
            )}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">{provider.name}</h1>
              <p className="mt-1 text-white/90 text-sm flex items-center gap-1">
                <Store className="h-4 w-4" />
                Parte de Beauty Therapist
              </p>
              {provider.description && (
                <p className="mt-4 text-white/90 max-w-2xl">{provider.description}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Productos</h2>
          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((p) => (
                <Card key={p.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white overflow-hidden">
                  <div className="relative aspect-square bg-gray-100">
                    <Image
                      src={p.image_url || "/placeholder.svg?height=300&width=300"}
                      alt={p.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 25vw"
                    />
                    {p.is_flash_sale && <Badge className="absolute top-2 left-2 bg-red-500">OFERTA</Badge>}
                    {p.is_best_seller && !p.is_flash_sale && (
                      <Badge className="absolute top-2 left-2 bg-green-500">BESTSELLER</Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-900">{p.name}</h3>
                    {p.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{p.description}</p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-lg font-bold text-pink-600">${p.price}</span>
                      {p.original_price != null && p.original_price > p.price && (
                        <span className="text-sm text-gray-500 line-through">${p.original_price}</span>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex gap-2">
                    <Link href={`/producto/${p.id}`} className="flex-1">
                      <Button variant="outline" className="w-full border-pink-600 text-pink-600 hover:bg-pink-50">
                        Ver producto
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 py-8">Este proveedor aún no tiene productos publicados.</p>
          )}
        </div>
      </section>

      {/* Videos */}
      <VideoSection slug={provider.slug} providerName={provider.name} />

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-400 text-sm">
          <p>
            Desarrollado por{" "}
            <Link href="/about/dev" className="underline hover:text-white">
              Josvaneiba
            </Link>
          </p>
          <p className="mt-1 text-gray-500">Parte de Beauty Therapist Platform</p>
        </div>
      </footer>
    </div>
  )
}
