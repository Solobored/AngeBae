"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAdminAuth } from "../providers"
import { ArrowLeft } from "lucide-react"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { isAuthenticated, loading: sessionLoading, refreshSession } = useAdminAuth()

  useEffect(() => {
    if (!sessionLoading && isAuthenticated) {
      router.replace("/admin")
    }
  }, [isAuthenticated, router, sessionLoading])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Credenciales incorrectas")
      } else {
        await refreshSession()
        router.push("/admin")
        router.refresh()
      }
    } catch (err) {
      console.error(err)
      setError("Error de servidor, inténtalo más tarde")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 flex flex-col">
      {/* Back Button */}
      <div className="p-4">
        <Link href="/admin">
          <button className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Volver a inicio
          </button>
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {/* Card */}
          <div className="bg-white rounded-xl shadow-lg p-8 space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Iniciar Sesión</h1>
              <p className="text-gray-600">
                Accede a tu cuenta de Beauty Therapist Professional
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-colors"
                  placeholder="tu@email.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-colors"
                  placeholder="Contraseña"
                  required
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 transition-all"
              >
                {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </button>
            </form>

            {/* Sign Up Link */}
            <div className="text-center">
              <p className="text-gray-600 text-sm">
                ¿No tienes cuenta?{" "}
                <Link href="/admin/signup" className="font-semibold text-pink-600 hover:text-pink-700">
                  Crea una
                </Link>
              </p>
            </div>

            {/* Demo Credentials */}
            <div className="pt-6 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
                Demo (para pruebas):
              </p>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm text-gray-600">
                <div>
                  <p className="font-medium text-gray-700">Email:</p>
                  <p className="font-mono text-xs">admin@angebae.com</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Contraseña:</p>
                  <p className="font-mono text-xs">Admin@123456</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-600">
            <p>
              Acceso seguro a la plataforma de{" "}
              <span className="font-semibold text-gray-900">Beauty Therapist Professional</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
