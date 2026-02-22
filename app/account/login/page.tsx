"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useUserAuth } from "@/app/user-auth-context"
import { Button } from "@/components/ui/button"

export default function UserLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { isAuthenticated, loading: sessionLoading, login } = useUserAuth()

  useEffect(() => {
    if (!sessionLoading && isAuthenticated) {
      router.replace("/")
    }
  }, [isAuthenticated, router, sessionLoading])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const result = await login(email, password)

    if (result.success) {
      router.push("/")
      router.refresh()
    } else {
      setError(result.error || "Error al iniciar sesión")
    }

    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Iniciar Sesión</h1>
          <p className="mt-2 text-gray-600">Accede a tu cuenta de Beauty Therapist</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-pink-500 focus:outline-none focus:ring-pink-500"
              placeholder="tu@email.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-pink-500 focus:outline-none focus:ring-pink-500"
              placeholder="Contraseña"
              required
            />
          </div>

          {error && <div className="text-red-600 text-sm text-center">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-gradient-to-r from-pink-600 to-purple-600 px-4 py-2 text-white font-medium hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>
        </form>

        <div className="text-center">
          <p className="text-gray-600 text-sm">
            ¿No tienes cuenta?{" "}
            <Link href="/account/signup" className="font-medium text-pink-600 hover:text-pink-700">
              Crear cuenta
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
