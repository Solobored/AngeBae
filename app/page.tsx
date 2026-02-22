"use client"

import { useState, useEffect } from "react"
import { ShoppingCart, Star, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Header } from "@/src/components/layout/Header"
import { CartSidebar } from "@/src/components/cart/CartSidebar"
import { StickyFilters } from "@/src/components/filters/StickyFilters"
import { DynamicOffersCarousel } from "@/src/components/offers/DynamicOffersCarousel"
import { ProductCard, type ProductCardProduct } from "@/src/components/store/ProductCard"
import { smartProductFilter } from "@/src/utils/smartSearch"

// Datos de ejemplo - en producción vendrían de la base de datos
const sampleProducts: ProductCardProduct[] = [
  {
    id: 1,
    name: "Serum Vitamina C Antioxidante",
    price: 2500,
    originalPrice: 3200,
    image: "/placeholder.svg?height=300&width=300",
    category: "serums",
    description: "Serum concentrado con vitamina C para iluminar y proteger la piel",
    isFlashSale: true,
    isBestSeller: true,
    rating: 4.8,
    reviews: 124,
  },
  {
    id: 2,
    name: "Crema Hidratante Ácido Hialurónico",
    price: 1800,
    image: "/placeholder.svg?height=300&width=300",
    category: "cremas",
    description: "Crema ultra hidratante con ácido hialurónico para todo tipo de piel",
    isBestSeller: true,
    rating: 4.6,
    reviews: 89,
  },
  {
    id: 3,
    name: "Limpiador Facial Suave",
    price: 1200,
    image: "/placeholder.svg?height=300&width=300",
    category: "limpiadores",
    description: "Limpiador suave para uso diario, apto para pieles sensibles",
    rating: 4.5,
    reviews: 67,
  },
  {
    id: 4,
    name: "Mascarilla Purificante Arcilla",
    price: 1500,
    originalPrice: 1800,
    image: "/placeholder.svg?height=300&width=300",
    category: "mascarillas",
    description: "Mascarilla de arcilla para purificar y minimizar poros",
    isFlashSale: true,
    rating: 4.4,
    reviews: 45,
  },
  {
    id: 5,
    name: "Protector Solar FPS 50",
    price: 2200,
    image: "/placeholder.svg?height=300&width=300",
    category: "proteccion",
    description: "Protector solar de amplio espectro, textura ligera",
    isBestSeller: true,
    rating: 4.7,
    reviews: 156,
  },
  {
    id: 6,
    name: "Tónico Equilibrante",
    price: 1400,
    image: "/placeholder.svg?height=300&width=300",
    category: "tonicos",
    description: "Tónico sin alcohol para equilibrar el pH de la piel",
    rating: 4.3,
    reviews: 78,
  },
]

const categories = [
  { id: "todos", name: "Todos los productos" },
  { id: "serums", name: "Serums" },
  { id: "cremas", name: "Cremas" },
  { id: "limpiadores", name: "Limpiadores" },
  { id: "mascarillas", name: "Mascarillas" },
  { id: "proteccion", name: "Protección Solar" },
  { id: "tonicos", name: "Tónicos" },
]

export default function HomePage() {
  const [products, setProducts] = useState<ProductCardProduct[]>(sampleProducts)
  const [filteredProducts, setFilteredProducts] = useState<ProductCardProduct[]>(sampleProducts)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("todos")
  const [sortBy, setSortBy] = useState("featured")
  const [cart, setCart] = useState<any[]>([])
  const [isSticky, setIsSticky] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false) // Added cart sidebar state
  const [brand, setBrand] = useState<{ logoUrl?: string; siteTitle?: string; subtitle?: string } | null>(null)

  useEffect(() => {
    const savedCart = localStorage.getItem("cart")
    if (savedCart) {
      setCart(JSON.parse(savedCart))
    }
  }, [])

  useEffect(() => {
    fetch("/api/products")
      .then((res) => (res.ok ? res.json() : []))
      .then((apiProducts: any[]) => {
        if (Array.isArray(apiProducts) && apiProducts.length > 0) {
          const mapped: ProductCardProduct[] = apiProducts.map((p) => ({
            id: p.id,
            name: p.name,
            price: Number(p.price) || 0,
            originalPrice: p.original_price != null ? Number(p.original_price) : null,
            image: p.image_url || null,
            description: p.description || null,
            category: p.category_id || undefined,
            isFlashSale: p.is_flash_sale,
            isBestSeller: p.is_best_seller,
            rating: undefined,
            reviews: undefined,
            provider_slug: p.provider_slug ?? null,
            provider_name: p.provider_name ?? null,
          }))
          setProducts(mapped)
          setFilteredProducts(mapped)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const heroSection = document.getElementById("hero-section")
      if (heroSection) {
        const heroBottom = heroSection.offsetTop + heroSection.offsetHeight
        setIsSticky(window.scrollY > heroBottom)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const slug = process.env.NEXT_PUBLIC_PROVIDER_SLUG || "angebae"
    fetch(`/api/providers/by-slug/${slug}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.brand_settings) {
          setBrand({
            logoUrl: data.brand_settings.logo_url || data.logo_url || undefined,
            siteTitle: data.brand_settings.site_title || data.name,
            subtitle: data.brand_settings.subtitle || "Parte de Beauty Therapist",
          })
        }
      })
      .catch(() => {
        // silent fallback
      })
  }, [])

  useEffect(() => {
    let filtered = products

    // Apply smart search filtering
    if (searchTerm) {
      filtered = smartProductFilter(filtered, searchTerm)
    }

    // Apply category filtering
    if (selectedCategory !== "todos") {
      filtered = filtered.filter((product) => product.category === selectedCategory)
    }

    // Apply sorting
    switch (sortBy) {
      case "price-low":
        filtered = [...filtered].sort((a, b) => a.price - b.price)
        break
      case "price-high":
        filtered = [...filtered].sort((a, b) => b.price - a.price)
        break
      case "rating":
        filtered = [...filtered].sort((a, b) => b.rating - a.rating)
        break
      case "newest":
        filtered = [...filtered].sort((a, b) => String(b.id).localeCompare(String(a.id)))
        break
      default:
        // Featured - prioritize flash sales and best sellers
        filtered = [...filtered].sort((a, b) => {
          if (a.isFlashSale && !b.isFlashSale) return -1
          if (!a.isFlashSale && b.isFlashSale) return 1
          if (a.isBestSeller && !b.isBestSeller) return -1
          if (!a.isBestSeller && b.isBestSeller) return 1
          return 0
        })
    }

    setFilteredProducts(filtered)
  }, [products, searchTerm, selectedCategory, sortBy])

  const updateCart = (newCart: any[]) => {
    setCart(newCart)
    localStorage.setItem("cart", JSON.stringify(newCart))
  }

  const addToCart = (product: any) => {
    const updatedCart = [...cart]
    const existing = updatedCart.find((item) => item.id === product.id)

    if (existing) {
      existing.quantity += 1
    } else {
      updatedCart.push({ ...product, quantity: 1 })
    }

    updateCart(updatedCart)
  }

  const updateQuantity = (id: string | number, quantity: number) => {
    if (quantity === 0) {
      removeFromCart(id)
      return
    }
    const updatedCart = cart.map((item) => (item.id === id ? { ...item, quantity } : item))
    updateCart(updatedCart)
  }

  const removeFromCart = (id: string | number) => {
    const updatedCart = cart.filter((item) => item.id !== id)
    updateCart(updatedCart)
  }

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const bestSellerProducts = products.filter((p) => p.isBestSeller)

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <Header searchTerm={searchTerm} onSearchChange={setSearchTerm} cartItemsCount={cartItemsCount} brand={brand ?? undefined} />

      {isSticky && (
        <StickyFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          sortBy={sortBy}
          onSortChange={setSortBy}
          categories={categories}
        />
      )}

      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
      />

      {/* Hero Section */}
      <section id="hero-section" className="relative bg-gradient-to-r from-pink-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 font-seatyio">AngeBae & Beauty Therapist</h1>
            <h2 className="text-2xl md:text-3xl font-medium mb-8 opacity-90 font-buttercup">
              Cuida tu piel con los mejores productos
            </h2>
            <p className="text-xl mb-8 opacity-90 font-inter">
              Descubre nuestra selección de productos premium para el cuidado facial
            </p>
            <Button
              size="lg"
              className="bg-white text-purple-600 hover:bg-gray-100 font-semibold px-8 py-3 text-lg shadow-lg font-inter"
              onClick={() => {
                document.getElementById("products-section")?.scrollIntoView({ behavior: "smooth" })
              }}
            >
              Ver Productos
            </Button>
          </div>
        </div>
      </section>

      {/* Floating cart button for large screens */}
      <div className="fixed bottom-6 right-6 z-40 hidden md:block">
        <Button
          onClick={() => setIsCartOpen(true)}
          className="rounded-full h-16 w-16 bg-gradient-to-r from-pink-600 to-purple-600 shadow-lg hover:shadow-xl transition-all hover:scale-105"
        >
          <ShoppingCart className="h-7 w-7 text-white" />
          {cartItemsCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-7 w-7 rounded-full p-0 flex items-center justify-center text-sm bg-red-500 text-white font-bold">
              {cartItemsCount}
            </Badge>
          )}
        </Button>
      </div>

      <div className="fixed bottom-4 right-4 z-40 md:hidden">
        <Button
          onClick={() => setIsCartOpen(true)}
          className="rounded-full h-16 w-16 bg-gradient-to-r from-pink-600 to-purple-600 shadow-lg hover:shadow-xl transition-all"
        >
          <ShoppingCart className="h-7 w-7 text-white" />
          {cartItemsCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-7 w-7 rounded-full p-0 flex items-center justify-center text-sm bg-red-500 text-white font-bold">
              {cartItemsCount}
            </Badge>
          )}
        </Button>
      </div>

      <DynamicOffersCarousel onAddToCart={addToCart} />

      {/* Best Sellers */}
      {bestSellerProducts.length > 0 && (
        <section className="py-12 bg-green-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center mb-8">
              <TrendingUp className="h-6 w-6 text-green-500 mr-2" />
              <h3 className="text-2xl font-bold text-green-600">Más Vendidos</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {bestSellerProducts.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Products Grid */}
      <section id="products-section" className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-2xl font-bold mb-8 font-seatyio">Todos los Productos</h3>

          {searchTerm && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                Mostrando {filteredProducts.length} resultado{filteredProducts.length !== 1 ? "s" : ""} para "
                {searchTerm}"
                {filteredProducts.length === 0 && (
                  <span className="block mt-1 text-blue-600">
                    Intenta buscar términos como "sol" para protectores solares, "ojos" para productos de contorno, o
                    "acné" para tratamientos específicos.
                  </span>
                )}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No se encontraron productos que coincidan con tu búsqueda.</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">angebae & beauty therapist</h3>
              <p className="text-gray-400">
                Los mejores productos para el cuidado de tu piel, seleccionados especialmente para ti.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contacto</h4>
              <p className="text-gray-400">Email: info@angebae.com</p>
              <p className="text-gray-400">WhatsApp: +56 9 1234-5678</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Información</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Envíos a todo Chile</li>
                <li>Retiro en punto de venta</li>
                <li>Garantía de calidad</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>
              Desarrollado por{" "}
              <Link href="/about/dev" className="underline hover:text-white">
                Josvaneiba
              </Link>
            </p>
            <p className="mt-1 text-gray-500">Parte de Beauty Therapist Platform</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
