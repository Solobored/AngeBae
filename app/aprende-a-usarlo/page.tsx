"use client"

import { useState, useEffect } from "react"
import { Search, Play, Clock, Eye, ArrowLeft, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import Link from "next/link"

interface Video {
  id: string
  title: string
  description: string
  thumbnail: string
  publishedAt: string
  channelTitle: string
  url: string
  duration?: string
  viewCount?: string
}

const categories = [
  { id: "all", name: "Todos los videos", query: "" },
  { id: "acne", name: "Acné y espinillas", query: "acne espinillas" },
  { id: "hydration", name: "Hidratación", query: "hidratacion piel seca" },
  { id: "anti-aging", name: "Anti-edad", query: "anti edad arrugas" },
  { id: "sensitive", name: "Piel sensible", query: "piel sensible" },
  { id: "sun-protection", name: "Protección solar", query: "protector solar" },
  { id: "eye-care", name: "Cuidado de ojos", query: "ojos ojeras pestañas" },
  { id: "cleansing", name: "Limpieza facial", query: "limpieza facial" },
]

export default function LearnHowToUsePage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([])

  useEffect(() => {
    fetchVideos()
  }, [])

  useEffect(() => {
    filterVideos()
  }, [videos, searchTerm, selectedCategory])

  const fetchVideos = async (query?: string) => {
    setLoading(true)
    try {
      const searchQuery = query || ""
      const response = await fetch(`/api/youtube/videos?q=${encodeURIComponent(searchQuery)}&maxResults=24`)
      const data = await response.json()

      if (data.videos) {
        setVideos(data.videos)
      }
    } catch (error) {
      console.error("Error fetching videos:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterVideos = () => {
    let filtered = videos

    if (searchTerm) {
      filtered = filtered.filter(
        (video) =>
          video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          video.description.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    setFilteredVideos(filtered)
  }

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId)
    const category = categories.find((cat) => cat.id === categoryId)
    if (category && category.query) {
      fetchVideos(category.query)
    } else {
      fetchVideos()
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      {/* Header - Updated to match main site design */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  ABT
                </h1>
              </Link>
              <div className="h-6 w-px bg-gray-200" />
              <div className="flex items-center">
                <BookOpen className="h-5 w-5 text-pink-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-800">Aprende a Usarlo</h2>
              </div>
            </div>

            {/* Search Bar - Made larger and consistent with main site */}
            <div className="flex-1 max-w-2xl mx-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Buscar tutoriales..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-3 text-base w-full bg-gray-50 border-gray-200 focus:bg-white focus:border-pink-300 focus:ring-pink-200 rounded-lg"
                />
              </div>
            </div>

            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a la tienda
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section - Updated to match main site gradient and styling */}
      <section className="bg-gradient-to-r from-pink-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">Aprende a Cuidar tu Piel</h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            Descubre tutoriales profesionales sobre cuidado de la piel, técnicas de aplicación y consejos de expertos
            para obtener los mejores resultados con nuestros productos.
          </p>
        </div>
      </section>

      {/* Categories - Updated styling to match main site */}
      <section className="py-8 bg-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategoryChange(category.id)}
                className={`mb-2 ${
                  selectedCategory === category.id
                    ? "bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
                    : "border-pink-200 text-pink-700 hover:bg-pink-50"
                }`}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Videos Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <Card key={i} className="overflow-hidden shadow-lg">
                  <div className="aspect-video bg-gray-200 animate-pulse" />
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 animate-pulse rounded mb-2" />
                    <div className="h-3 bg-gray-200 animate-pulse rounded w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredVideos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredVideos.map((video) => (
                <Card key={video.id} className="overflow-hidden hover:shadow-xl transition-shadow group shadow-lg">
                  <CardHeader className="p-0">
                    <div className="relative aspect-video">
                      <Image
                        src={video.thumbnail || "/placeholder.svg"}
                        alt={video.title}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
                          asChild
                        >
                          <a href={video.url} target="_blank" rel="noopener noreferrer">
                            <Play className="h-4 w-4 mr-2" />
                            Ver Video
                          </a>
                        </Button>
                      </div>
                      <Badge className="absolute bottom-2 right-2 bg-black/70 text-white">
                        <Clock className="h-3 w-3 mr-1" />
                        {video.duration || "Tutorial"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-sm line-clamp-2 mb-2 text-gray-800">{video.title}</h3>
                    <p className="text-xs text-gray-600 line-clamp-2 mb-3">{video.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{video.channelTitle}</span>
                      <span>{formatDate(video.publishedAt)}</span>
                    </div>
                    {video.viewCount && (
                      <div className="flex items-center mt-2 text-xs text-gray-500">
                        <Eye className="h-3 w-3 mr-1" />
                        {video.viewCount} visualizaciones
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No se encontraron videos</h3>
                <p className="text-gray-600 mb-4">
                  Intenta con otros términos de búsqueda o selecciona una categoría diferente.
                </p>
                <Button
                  onClick={() => {
                    setSearchTerm("")
                    setSelectedCategory("all")
                    fetchVideos()
                  }}
                  className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
                >
                  Ver todos los videos
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section - Updated to match main site styling */}
      <section className="py-16 bg-gradient-to-r from-pink-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold mb-4">¿Tienes alguna pregunta específica?</h3>
          <p className="text-lg opacity-90 mb-8">
            Nuestro equipo de expertos está aquí para ayudarte con cualquier duda sobre el cuidado de tu piel.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/#products-section">
              <Button
                size="lg"
                className="bg-white text-purple-600 hover:bg-gray-100 font-semibold px-8 py-3 shadow-lg"
              >
                Ver Productos
              </Button>
            </Link>
            <Button
              size="lg"
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3 shadow-lg transition-all duration-200 border-2 border-orange-500"
              onClick={() => {
                window.open("mailto:angebae.beautyexpert@gmail.com?subject=Consulta sobre cuidado de la piel", "_blank")
              }}
            >
              Contactar Experto
            </Button>
          </div>

          <div className="mt-12 p-6 bg-white/10 backdrop-blur-sm rounded-lg">
            <h4 className="text-xl font-semibold mb-4">Información de Contacto</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium">Email</p>
                <p className="opacity-90">angebae.beautyexpert@gmail.com</p>
              </div>
              <div>
                <p className="font-medium">WhatsApp</p>
                <p className="opacity-90">+56 9 8765-4321</p>
              </div>
              <div>
                <p className="font-medium">Instagram</p>
                <p className="opacity-90">@angebae_beauty</p>
              </div>
            </div>
            <div className="mt-4 text-xs opacity-75">
              <p>* Foto del experto y redes sociales adicionales se agregarán próximamente</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Added footer to match main site */}
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
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 angebae & beauty therapist. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
