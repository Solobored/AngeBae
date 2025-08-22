"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { CheckCircle, Package, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function CheckoutSuccess() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("orderId")
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (orderId) {
      fetchOrder()
      // Clear cart from localStorage
      localStorage.removeItem("cart")
    }
  }, [orderId])

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`)
      if (response.ok) {
        const orderData = await response.json()
        setOrder(orderData)
      }
    } catch (error) {
      console.error("Error fetching order:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-800">¡Pago Exitoso!</CardTitle>
          <p className="text-gray-600">Tu pedido ha sido procesado correctamente</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {order && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Detalles del Pedido</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Número de Pedido:</span>
                  <p className="font-medium">{order.order_number}</p>
                </div>
                <div>
                  <span className="text-gray-600">Total Pagado:</span>
                  <p className="font-medium text-green-600">${order.total}</p>
                </div>
                <div>
                  <span className="text-gray-600">Método de Entrega:</span>
                  <p className="font-medium">
                    {order.shipping_method === "pickup" ? "Retiro en punto de venta" : "Envío a domicilio"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Contacto:</span>
                  <p className="font-medium">{order.customer_email || order.customer_phone}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start space-x-3">
              <Package className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-800">¿Qué sigue?</h4>
                <ul className="text-sm text-blue-700 mt-2 space-y-1">
                  <li>• Te contactaremos pronto para coordinar la entrega</li>
                  <li>• Recibirás un email de confirmación</li>
                  <li>• Prepararemos tu pedido con el mayor cuidado</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full bg-transparent">
                Seguir Comprando
              </Button>
            </Link>
            <Link href="/mis-pedidos" className="flex-1">
              <Button className="w-full bg-gradient-to-r from-pink-600 to-purple-600">
                Ver Mis Pedidos
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          <div className="text-center text-sm text-gray-500">
            <p>¿Tienes alguna pregunta? Contáctanos a info@skincarepro.com</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
