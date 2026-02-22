"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAdminAuth } from "../providers"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function AdminSignupPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [passwordStrength, setPasswordStrength] = useState(0)
  const router = useRouter()
  const { isAuthenticated, loading: sessionLoading, refreshSession } = useAdminAuth()

  useEffect(() => {
    if (!sessionLoading && isAuthenticated) {
      router.replace("/admin")
    }
  }, [isAuthenticated, router, sessionLoading])

  const calculatePasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 6) strength++
    if (password.length >= 12) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++
    return strength
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    if (name === "password") {
      setPasswordStrength(calculatePasswordStrength(value))
    }
  }

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError("Email y contraseña son requeridos")
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden")
      return false
    }

    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError("Email inválido")
      return false
    }

    return true
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      // Try to use admin signup endpoint if it exists, otherwise create user
      const res = await fetch("/api/admin/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Error al registrarse. Intenta de nuevo.")
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

  const getPasswordStrengthColor = () => {
    if (passwordStrength === 0) return "bg-gray-300"
    if (passwordStrength <= 2) return "bg-red-500"
    if (passwordStrength <= 3) return "bg-yellow-500"
    return "bg-green-500"
  }

  const getPasswordStrengthText = () => {
    if (passwordStrength === 0) return ""
    if (passwordStrength <= 2) return "Débil"
    if (passwordStrength <= 3) return "Media"
    return "Fuerte"
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Crear Cuenta Profesional
              </h1>
              <p className="text-gray-600">
                Únete a Beauty Therapist y comienza a vender hoy
              </p>
            </div>

            <form onSubmit={handleSignup} className="space-y-6">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre (Opcional)
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-colors"
                  placeholder="Tu nombre o nombre de empresa"
                />
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-colors"
                  placeholder="tu@email.com"
                  required
                />
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-colors"
                  placeholder="Mínimo 6 caracteres"
                  required
                />
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getPasswordStrengthColor()} transition-all`}
                          style={{ width: `${(passwordStrength / 5) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-medium text-gray-600">
                        {getPasswordStrengthText()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Usa mayúsculas, números y símbolos para mayor seguridad
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Contraseña
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-colors"
                  placeholder="Repite tu contraseña"
                  required
                />
                {formData.password && formData.confirmPassword && (
                  <p className={`text-xs mt-1 ${
                    formData.password === formData.confirmPassword
                      ? "text-green-600"
                      : "text-red-600"
                  }`}>
                    {formData.password === formData.confirmPassword
                      ? "✓ Las contraseñas coinciden"
                      : "✗ Las contraseñas no coinciden"}
                  </p>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 transition-all"
              >
                {loading ? "Creando cuenta..." : "Crear Cuenta"}
              </button>
            </form>

            {/* Sign In Link */}
            <div className="text-center">
              <p className="text-gray-600 text-sm">
                ¿Ya tienes cuenta?{" "}
                <Link href="/admin/login" className="font-semibold text-pink-600 hover:text-pink-700">
                  Inicia sesión
                </Link>
              </p>
            </div>

            {/* Benefits */}
            <div className="pt-6 border-t border-gray-200 space-y-3">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Al registrarte obtienes:
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <span className="w-5 h-5 bg-pink-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    ✓
                  </span>
                  Tienda profesional en Beauty Therapist
                </li>
                <li className="flex items-center">
                  <span className="w-5 h-5 bg-pink-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    ✓
                  </span>
                  Panel de control con métricas
                </li>
                <li className="flex items-center">
                  <span className="w-5 h-5 bg-pink-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    ✓
                  </span>
                  Acceso a miles de clientes
                </li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-600">
            <p>
              Al crear una cuenta aceptas nuestros{" "}
              <Link href="/" className="text-pink-600 hover:underline">
                Términos de servicio
              </Link>{" "}
              y{" "}
              <Link href="/" className="text-pink-600 hover:underline">
                Política de privacidad
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
