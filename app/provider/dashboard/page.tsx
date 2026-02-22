"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Store, BarChart3 } from "lucide-react"

export default function ProviderDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="rounded-2xl bg-white shadow-sm border border-gray-200 p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center text-white">
              <Store className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Panel de proveedor</h1>
              <p className="text-gray-600 text-sm">
                Gestiona tu tienda y productos en Beauty Therapist
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-amber-50 border border-amber-200 p-6 mb-8">
            <p className="text-amber-800 font-medium">Dashboard disponible próximamente</p>
            <p className="text-amber-700/90 text-sm mt-1">
              Aquí podrás ver tu branding, subir productos, gestionar OCR y ver estadísticas. Mientras tanto, usa el panel de administración si tienes acceso.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/provider/login">
              <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-pink-300 hover:bg-pink-50/50 transition-colors">
                <div className="w-12 h-12 rounded-lg bg-pink-100 flex items-center justify-center">
                  <Store className="h-6 w-6 text-pink-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Mi tienda</p>
                  <p className="text-sm text-gray-500">Inicia sesión para ver tu tienda</p>
                </div>
              </div>
            </Link>
            <Link href="/admin">
              <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 transition-colors">
                <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Panel Admin</p>
                  <p className="text-sm text-gray-500">Productos, pedidos, medios</p>
                </div>
              </div>
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <Link href="/">
              <Button variant="outline">← Volver al inicio</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
