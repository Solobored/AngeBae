"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { User } from "lucide-react"

export default function ProviderLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/providers/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Credenciales incorrectas")
      } else {
        const slug = data.provider?.slug
        router.push(slug ? `/store/${slug}` : "/provider/dashboard")
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 px-4">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg border border-gray-100">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white mb-4">
            <User className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Acceso Profesionales</h1>
          <p className="mt-2 text-gray-600 text-sm">
            Cosmetólogos, dermatólogos y proveedores de la plataforma Beauty Therapist
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 shadow-sm focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
              placeholder="tu@email.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 shadow-sm focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-medium py-2.5"
          >
            {loading ? "Iniciando sesión..." : "Iniciar sesión"}
          </Button>
        </form>

        <div className="text-center space-y-2">
          <p className="text-sm text-gray-500">
            ¿Aún no tienes cuenta?{" "}
            <Link href="/provider/signup" className="text-pink-600 hover:underline font-medium">
              Regístrate como profesional
            </Link>
          </p>
          <p className="text-sm text-gray-500">
            <Link href="/" className="text-gray-600 hover:underline">
              ← Volver al inicio
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
