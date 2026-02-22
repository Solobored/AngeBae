"use client"

import { useRouter } from "next/navigation"
import { useAdminAuth } from "../providers"

export function AdminDashboard() {
  const router = useRouter()
  const { logout } = useAdminAuth()

  const handleLogout = async () => {
    await logout()
    router.push("/admin/login")
  }

  const handleViewStore = () => {
    router.push("/")
  }

  const handleAddProduct = () => {
    router.push("/admin/products/add")
  }

  const handleViewOrders = () => {
    router.push("/admin/orders")
  }

  const handleManageCategories = () => {
    router.push("/admin/categories")
  }

  const handleUploadCatalog = () => {
    router.push("/admin/catalog")
  }

  const handleManageOffers = () => {
    router.push("/admin/offers")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
            <div className="flex space-x-4">
              <button
                onClick={handleViewStore}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Ver Tienda
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Stats Cards */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-pink-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-medium">P</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Productos</dt>
                      <dd className="text-lg font-medium text-gray-900">24</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-medium">O</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Pedidos</dt>
                      <dd className="text-lg font-medium text-gray-900">12</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-medium">C</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Categorías</dt>
                      <dd className="text-lg font-medium text-gray-900">8</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-medium">V</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Ventas</dt>
                      <dd className="text-lg font-medium text-gray-900">$45,230</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Acciones Rápidas</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <button
                  onClick={handleAddProduct}
                  className="bg-pink-600 text-white px-4 py-2 rounded-md hover:bg-pink-700 transition-colors"
                >
                  Agregar Producto
                </button>
                <button
                  onClick={handleViewOrders}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  Ver Pedidos
                </button>
                <button
                  onClick={handleManageCategories}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Gestionar Categorías
                </button>
                <button
                  onClick={handleUploadCatalog}
                  className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
                >
                  Subir Catálogo PDF
                </button>
                <button
                  onClick={handleManageOffers}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                >
                  Gestionar Ofertas
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
