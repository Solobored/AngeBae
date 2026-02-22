"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAdminAuth } from "../../../providers"

interface OfferDetails {
  id: string
  product_id: string
  product_name: string
  offer_price: number
  start_date: string
  end_date: string
  is_active: boolean
  position: number
}

function toLocalDateTimeValue(dateInput: string): string {
  const date = new Date(dateInput)
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

export default function EditOfferPage() {
  const params = useParams<{ id: string }>()
  const offerId = Array.isArray(params.id) ? params.id[0] : params.id
  const router = useRouter()
  const { isAuthenticated, loading: authLoading } = useAdminAuth()
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [offer, setOffer] = useState<OfferDetails | null>(null)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/admin/login")
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (!authLoading && isAuthenticated && offerId) {
      fetchOffer(offerId)
    }
  }, [authLoading, isAuthenticated, offerId])

  const fetchOffer = async (id: string) => {
    try {
      const response = await fetch(`/api/offers/${id}`)
      if (!response.ok) {
        throw new Error("No se pudo cargar la oferta")
      }

      const data = await response.json()
      const loadedOffer: OfferDetails = data.offer

      setOffer({
        ...loadedOffer,
        start_date: toLocalDateTimeValue(loadedOffer.start_date),
        end_date: toLocalDateTimeValue(loadedOffer.end_date),
      })
    } catch (fetchError) {
      console.error(fetchError)
      setError("Error cargando oferta")
    } finally {
      setPageLoading(false)
    }
  }

  const updateOffer = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!offer) return

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch(`/api/offers/${offer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offer_price: Number(offer.offer_price),
          start_date: new Date(offer.start_date).toISOString(),
          end_date: new Date(offer.end_date).toISOString(),
          is_active: offer.is_active,
          position: offer.position,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Error actualizando oferta")
      }

      setSuccess("Oferta actualizada exitosamente")
      setTimeout(() => router.push("/admin/offers"), 900)
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Error actualizando oferta")
    } finally {
      setLoading(false)
    }
  }

  const deleteOffer = async () => {
    if (!offer) return
    if (!confirm("¿Seguro que deseas eliminar esta oferta?")) return

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch(`/api/offers/${offer.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Error eliminando oferta")
      }

      router.push("/admin/offers")
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Error eliminando oferta")
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || !isAuthenticated || pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Cargando...</div>
      </div>
    )
  }

  if (!offer) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-red-600">No se encontró la oferta.</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button variant="ghost" size="sm" onClick={() => router.push("/admin/offers")} className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Editar Oferta</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={updateOffer}>
            <Card>
              <CardHeader>
                <CardTitle>{offer.product_name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="offer_price">Precio de oferta *</Label>
                    <Input
                      id="offer_price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={offer.offer_price}
                      onChange={(event) => setOffer((prev) => (prev ? { ...prev, offer_price: Number(event.target.value) } : prev))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="position">Posición</Label>
                    <Input
                      id="position"
                      type="number"
                      min="1"
                      value={offer.position}
                      onChange={(event) => setOffer((prev) => (prev ? { ...prev, position: Number(event.target.value) || 1 } : prev))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date">Inicio *</Label>
                    <Input
                      id="start_date"
                      type="datetime-local"
                      value={offer.start_date}
                      onChange={(event) => setOffer((prev) => (prev ? { ...prev, start_date: event.target.value } : prev))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_date">Fin *</Label>
                    <Input
                      id="end_date"
                      type="datetime-local"
                      value={offer.end_date}
                      onChange={(event) => setOffer((prev) => (prev ? { ...prev, end_date: event.target.value } : prev))}
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="is_active"
                    checked={offer.is_active}
                    onCheckedChange={(checked) => setOffer((prev) => (prev ? { ...prev, is_active: Boolean(checked) } : prev))}
                  />
                  <Label htmlFor="is_active">Oferta activa</Label>
                </div>

                <div className="flex justify-between">
                  <Button type="button" variant="outline" className="text-red-600 hover:text-red-700" onClick={deleteOffer} disabled={loading}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar Oferta
                  </Button>
                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={() => router.push("/admin/offers")}>
                      Cancelar
                    </Button>
                    <Button type="submit" className="bg-red-600 hover:bg-red-700" disabled={loading}>
                      {loading ? "Guardando..." : "Guardar Cambios"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>
      </main>
    </div>
  )
}
