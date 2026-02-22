"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useUserAuth } from "@/app/user-auth-context"

export default function UserSignupPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { isAuthenticated, loading: sessionLoading, signup } = useUserAuth()

  useEffect(() => {
    if (!sessionLoading && isAuthenticated) {
      router.replace("/")
    }
  }, [isAuthenticated, router, sessionLoading])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      return
    }

    setLoading(true)

    const result = await signup(formData.email, formData.password, formData.name)

    if (result.success) {
      router.push("/")
      router.refresh()
    } else {
      setError(result.error || "Error al crear la cuenta")
    }

    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Crear Cuenta</h1>
          <p className="mt-2 text-gray-600">Únete a Beauty Therapist hoy</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Nombre completo
            </label>
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-pink-500 focus:outline-none focus:ring-pink-500"
              placeholder="Tu nombre"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
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
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-pink-500 focus:outline-none focus:ring-pink-500"
              placeholder="Mínimo 6 caracteres"
              required
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirmar contraseña
            </label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-pink-500 focus:outline-none focus:ring-pink-500"
              placeholder="Repite tu contraseña"
              required
            />
          </div>

          {error && <div className="text-red-600 text-sm text-center">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-gradient-to-r from-pink-600 to-purple-600 px-4 py-2 text-white font-medium hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? "Creando cuenta..." : "Crear Cuenta"}
          </button>
        </form>

        <div className="text-center">
          <p className="text-gray-600 text-sm">
            ¿Ya tienes cuenta?{" "}
            <Link href="/account/login" className="font-medium text-pink-600 hover:text-pink-700">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
