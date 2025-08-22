"use client"

import type React from "react"

import { useState } from "react"
import { ArrowLeft, CreditCard, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataExplanation } from "@/src/components/checkout/DataExplanation"
import Link from "next/link"

export default function CheckoutPage() {
  const [contactMethod, setContactMethod] = useState("email")
  const [shippingMethod, setShippingMethod] = useState("pickup")
  const [formData, setFormData] = useState({
    name: "",
    rut: "",
    email: "",
    phone: "",
    address: "",
    region: "",
    comuna: "",
  })

  // Datos del carrito de ejemplo - en producción vendrían del estado global
  const cartItems = [
    {
      id: 1,
      name: "Serum Vitamina C Antioxidante",
      price: 2500,
      quantity: 1,
      image: "/placeholder.svg?height=80&width=80",
    },
    {
      id: 2,
      name: "Crema Hidratante Ácido Hialurónico",
      price: 1800,
      quantity: 2,
      image: "/placeholder.svg?height=80&width=80",
    },
  ]

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shippingCost = shippingMethod === "delivery" ? 500 : 0
  const total = subtotal + shippingCost
  const [acceptTerms, setAcceptTerms] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.rut || !formData.email || !formData.phone) {
      alert("Por favor completa todos los campos obligatorios")
      return
    }

    if (shippingMethod === "delivery" && (!formData.address || !formData.region || !formData.comuna)) {
      alert("Por favor completa la información de envío")
      return
    }

    if (!acceptTerms) {
      alert("Debes aceptar los términos y condiciones para continuar")
      return
    }

    // Crear el pedido en la base de datos
    try {
      const orderData = {
        customer_name: formData.name,
        customer_rut: formData.rut,
        customer_email: formData.email,
        customer_phone: formData.phone,
        shipping_address: shippingMethod === "delivery" ? formData.address : null,
        shipping_region: shippingMethod === "delivery" ? formData.region : null,
        shipping_comuna: shippingMethod === "delivery" ? formData.comuna : null,
        contact_method: contactMethod,
        shipping_method: shippingMethod,
        shipping_cost: shippingCost,
        subtotal: subtotal,
        total: total,
        items: cartItems,
      }

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      })

      if (response.ok) {
        const order = await response.json()
        // Redirigir a Mercado Pago con el ID del pedido
        window.location.href = `/api/mercadopago/create-preference?orderId=${order.id}`
      } else {
        alert("Error al crear el pedido. Inténtalo nuevamente.")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al procesar el pedido. Inténtalo nuevamente.")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4" />
              <span>Volver a la tienda</span>
            </Link>
            <h1 className="text-xl font-semibold">Finalizar Compra</h1>
            <div></div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulario de checkout */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Información Personal</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="name">Nombre Completo *</Label>
                    <DataExplanation field="name" />
                  </div>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Juan Pérez González"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="rut">RUT *</Label>
                    <DataExplanation field="rut" />
                  </div>
                  <Input
                    id="rut"
                    type="text"
                    placeholder="12.345.678-9"
                    value={formData.rut}
                    onChange={(e) => handleInputChange("rut", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="email">Email *</Label>
                    <DataExplanation field="email" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="phone">Teléfono/WhatsApp *</Label>
                    <DataExplanation field="phone" />
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+56 9 1234-5678"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Truck className="h-5 w-5" />
                  <span>Método de Entrega</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup value={shippingMethod} onValueChange={setShippingMethod}>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="pickup" id="pickup" />
                      <div>
                        <Label htmlFor="pickup" className="font-medium">
                          Retiro en punto de venta
                        </Label>
                        <p className="text-sm text-gray-500">Gratis - Coordinaremos el punto de encuentro</p>
                      </div>
                    </div>
                    <span className="font-medium text-green-600">Gratis</span>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="delivery" id="delivery" />
                      <div>
                        <Label htmlFor="delivery" className="font-medium">
                          Envío a domicilio
                        </Label>
                        <p className="text-sm text-gray-500">Envío a tu dirección</p>
                      </div>
                    </div>
                    <span className="font-medium">$500</span>
                  </div>
                </RadioGroup>

                {shippingMethod === "delivery" && (
                  <div className="space-y-4 mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium">Información de Envío</h4>

                    <div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="address">Dirección Completa *</Label>
                        <DataExplanation field="address" />
                      </div>
                      <Input
                        id="address"
                        type="text"
                        placeholder="Av. Providencia 1234, Depto 56"
                        value={formData.address}
                        onChange={(e) => handleInputChange("address", e.target.value)}
                        required={shippingMethod === "delivery"}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Label htmlFor="region">Región *</Label>
                          <DataExplanation field="region" />
                        </div>
                        <Select value={formData.region} onValueChange={(value) => handleInputChange("region", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar región" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="metropolitana">Región Metropolitana</SelectItem>
                            <SelectItem value="valparaiso">Valparaíso</SelectItem>
                            <SelectItem value="biobio">Biobío</SelectItem>
                            <SelectItem value="araucania">La Araucanía</SelectItem>
                            <SelectItem value="los-lagos">Los Lagos</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <Label htmlFor="comuna">Comuna *</Label>
                          <DataExplanation field="comuna" />
                        </div>
                        <Input
                          id="comuna"
                          type="text"
                          placeholder="Providencia"
                          value={formData.comuna}
                          onChange={(e) => handleInputChange("comuna", e.target.value)}
                          required={shippingMethod === "delivery"}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Resumen del pedido */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Resumen del Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-xs text-gray-500">IMG</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.name}</h4>
                      <p className="text-sm text-gray-500">Cantidad: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${item.price * item.quantity}</p>
                    </div>
                  </div>
                ))}

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Envío</span>
                    <span>{shippingCost === 0 ? "Gratis" : `$${shippingCost}`}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>${total.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Protección al Consumidor</h4>
                <p className="text-sm text-blue-800">
                  Este sitio cumple con la Ley N° 19.496 de Protección de los Derechos de los Consumidores de Chile.
                  Tienes derecho a retracto dentro de 10 días corridos desde la recepción del producto.
                </p>
              </div>

              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-1"
                />
                <label htmlFor="terms" className="text-sm text-gray-600">
                  Acepto los{" "}
                  <Link href="/terminos-y-condiciones" className="text-blue-600 hover:underline">
                    términos y condiciones de compra
                  </Link>
                  , la{" "}
                  <Link href="/politica-privacidad" className="text-blue-600 hover:underline">
                    política de privacidad
                  </Link>{" "}
                  y confirmo que he leído la información sobre protección de datos personales según la Ley N° 19.628.
                </label>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white py-3 text-lg"
                size="lg"
                disabled={!acceptTerms}
              >
                Pagar con Mercado Pago
              </Button>
            </form>

            <div className="text-center text-sm text-gray-500">
              <p>Pago seguro procesado por Mercado Pago</p>
              <p className="mt-1">Cumplimos con los estándares de seguridad PCI DSS</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
