"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAdminAuth } from "./providers"
import { AdminLandingPage } from "./components/admin-landing"
import { AdminDashboard } from "./components/admin-dashboard"

export default function AdminPage() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading } = useAdminAuth()

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  // If authenticated, show dashboard
  if (isAuthenticated) {
    return <AdminDashboard />
  }

  // If not authenticated, show landing page
  return <AdminLandingPage />
}
