"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

interface Offer {
  id: number
  product_id: number
  product_name: string
  product_image: string
  original_price: number
  offer_price: number
  discount_percentage: number
  start_date: string
  end_date: string
  is_active: boolean
  position: number
  created_at: string
}

export default function OffersManagementPage() {
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check authentication
    const adminAuth = document.cookie.includes("admin_auth=true")
    if (!adminAuth) {
      router.push("/admin/login")
      return
    }

    fetchOffers()
  }, [router])

  const fetchOffers = async () => {
    try {
      const response = await fetch("/api/offers")
      const data = await response.json()
      setOffers(data.offers || [])
    } catch (error) {
      console.error("Error fetching offers:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleOfferStatus = async (offerId: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/offers/${offerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !currentStatus }),
      })

      if (response.ok) {
        fetchOffers()
      }
    } catch (error) {
      console.error("Error updating offer status:", error)
    }
  }

  const deleteOffer = async (offerId: number) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta oferta?")) return

    try {
      const response = await fetch(`/api/offers/${offerId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchOffers()
      }
    } catch (error) {
      console.error("Error deleting offer:", error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES")
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Cargando ofertas...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => router.push("/admin")} className="flex items-center">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Panel
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Ofertas</h1>
            </div>
            <Button onClick={() => router.push("/admin/offers/create")} className="bg-red-600 hover:bg-red-700">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Oferta
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {offers.length === 0 ? (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay ofertas configuradas</h3>
                <p className="text-gray-600 mb-4">
                  Crea tu primera oferta para mostrar productos destacados en la página principal.
                </p>
                <Button onClick={() => router.push("/admin/offers/create")} className="bg-red-600 hover:bg-red-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primera Oferta
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {offers.map((offer) => (
                <Card key={offer.id} className="overflow-hidden">
                  <CardHeader className="p-0">
                    <div className="relative">
                      <Image
                        src={offer.product_image || "/placeholder.svg"}
                        alt={offer.product_name}
                        width={300}
                        height={200}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute top-2 left-2 flex gap-2">
                        <Badge className={offer.is_active ? "bg-green-500" : "bg-gray-500"}>
                          {offer.is_active ? "Activa" : "Inactiva"}
                        </Badge>
                        <Badge className="bg-red-500">-{offer.discount_percentage}%</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <CardTitle className="text-lg mb-2 line-clamp-2">{offer.product_name}</CardTitle>
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="text-lg font-bold text-red-600">${offer.offer_price}</span>
                      <span className="text-sm text-gray-500 line-through">${offer.original_price}</span>
                    </div>
                    <div className="text-sm text-gray-600 mb-4">
                      <p>Desde: {formatDate(offer.start_date)}</p>
                      <p>Hasta: {formatDate(offer.end_date)}</p>
                      <p>Posición: #{offer.position}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleOfferStatus(offer.id, offer.is_active)}
                        className="flex-1"
                      >
                        {offer.is_active ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-1" />
                            Desactivar
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-1" />
                            Activar
                          </>
                        )}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => router.push(`/admin/offers/edit/${offer.id}`)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteOffer(offer.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
