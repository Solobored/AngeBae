"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAdminAuth } from "../../providers"

interface ProductOption {
  id: string
  name: string
  price: number
}

function toLocalDateTimeValue(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

export default function CreateOfferPage() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading } = useAdminAuth()
  const [products, setProducts] = useState<ProductOption[]>([])
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [form, setForm] = useState({
    product_id: "",
    offer_price: "",
    start_date: toLocalDateTimeValue(new Date()),
    end_date: toLocalDateTimeValue(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    is_active: true,
    position: 1,
  })

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/admin/login")
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchProducts()
    }
  }, [authLoading, isAuthenticated])

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === form.product_id),
    [form.product_id, products],
  )

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products")
      if (!response.ok) {
        throw new Error("No se pudieron cargar productos")
      }

      const data = await response.json()
      setProducts(data)
    } catch (fetchError) {
      console.error(fetchError)
      setError("Error cargando productos")
    } finally {
      setPageLoading(false)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      if (!form.product_id || !form.offer_price || !form.start_date || !form.end_date) {
        throw new Error("Completa todos los campos requeridos")
      }

      const response = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: form.product_id,
          offer_price: Number(form.offer_price),
          start_date: new Date(form.start_date).toISOString(),
          end_date: new Date(form.end_date).toISOString(),
          is_active: form.is_active,
          position: form.position,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Error al crear oferta")
      }

      setSuccess("Oferta creada exitosamente")
      setTimeout(() => {
        router.push("/admin/offers")
      }, 900)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Error al crear oferta")
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button variant="ghost" size="sm" onClick={() => router.push("/admin/offers")} className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Nueva Oferta</h1>
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

          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Configurar Oferta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Producto *</Label>
                  <Select value={form.product_id} onValueChange={(value) => setForm((prev) => ({ ...prev, product_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar producto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedProduct ? (
                    <p className="mt-2 text-sm text-gray-600">Precio actual: ${selectedProduct.price}</p>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="offer_price">Precio de oferta *</Label>
                    <Input
                      id="offer_price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.offer_price}
                      onChange={(event) => setForm((prev) => ({ ...prev, offer_price: event.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="position">Posición</Label>
                    <Input
                      id="position"
                      type="number"
                      min="1"
                      value={form.position}
                      onChange={(event) => setForm((prev) => ({ ...prev, position: Number(event.target.value) || 1 }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date">Inicio *</Label>
                    <Input
                      id="start_date"
                      type="datetime-local"
                      value={form.start_date}
                      onChange={(event) => setForm((prev) => ({ ...prev, start_date: event.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_date">Fin *</Label>
                    <Input
                      id="end_date"
                      type="datetime-local"
                      value={form.end_date}
                      onChange={(event) => setForm((prev) => ({ ...prev, end_date: event.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="is_active"
                    checked={form.is_active}
                    onCheckedChange={(checked) => setForm((prev) => ({ ...prev, is_active: Boolean(checked) }))}
                  />
                  <Label htmlFor="is_active">Oferta activa</Label>
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => router.push("/admin/offers")}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-red-600 hover:bg-red-700" disabled={loading}>
                    {loading ? "Guardando..." : "Crear Oferta"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>
      </main>
    </div>
  )
}
