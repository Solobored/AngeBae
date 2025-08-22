"use client"

import { useSearchParams } from "next/navigation"
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function CheckoutFailure() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("orderId")

  const handleRetry = () => {
    if (orderId) {
      window.location.href = `/api/mercadopago/create-preference?orderId=${orderId}`
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-800">Pago No Completado</CardTitle>
          <p className="text-gray-600">Hubo un problema al procesar tu pago</p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2 text-red-800">¿Qué pasó?</h3>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• El pago pudo haber sido rechazado por tu banco</li>
              <li>• Puede haber un problema temporal con el procesador de pagos</li>
              <li>• Los datos de la tarjeta podrían ser incorrectos</li>
              <li>• La sesión pudo haber expirado</li>
            </ul>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">¿Qué puedes hacer?</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Verifica los datos de tu tarjeta</li>
              <li>• Asegúrate de tener fondos suficientes</li>
              <li>• Intenta con otro método de pago</li>
              <li>• Contacta a tu banco si el problema persiste</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/cart" className="flex-1">
              <Button variant="outline" className="w-full bg-transparent">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Carrito
              </Button>
            </Link>
            {orderId && (
              <Button onClick={handleRetry} className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600">
                <RefreshCw className="w-4 h-4 mr-2" />
                Intentar Nuevamente
              </Button>
            )}
          </div>

          <div className="text-center text-sm text-gray-500">
            <p>¿Necesitas ayuda? Contáctanos a info@skincarepro.com o WhatsApp +56 9 1234 5678</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
