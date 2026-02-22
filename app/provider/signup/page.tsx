"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"

export default function ProviderSignupPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)

    try {
      const res = await fetch("/api/providers/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Error al crear la cuenta")
      } else {
        setSuccess(true)
        setTimeout(() => router.push("/provider/login"), 2000)
      }
    } catch (err) {
      console.error(err)
      setError("Error de servidor, inténtalo más tarde")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 px-4">
        <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg border border-gray-100 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 text-green-600 mb-4">
            <UserPlus className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Cuenta creada</h1>
          <p className="mt-2 text-gray-600 text-sm">
            Ya puedes iniciar sesión y configurar tu tienda.
          </p>
          <Link href="/provider/login" className="mt-6 inline-block">
            <Button className="bg-gradient-to-r from-pink-600 to-purple-600">
              Ir a iniciar sesión
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 px-4 py-8">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg border border-gray-100">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white mb-4">
            <UserPlus className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Registro de profesionales</h1>
          <p className="mt-2 text-gray-600 text-sm">
            Crea tu cuenta como cosmetólogo o dermatólogo en Beauty Therapist
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre o marca
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 shadow-sm focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
              placeholder="Ej. AngeBae"
              required
              minLength={2}
            />
          </div>

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
              Contraseña (mín. 6 caracteres)
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 shadow-sm focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
              placeholder="••••••••"
              required
              minLength={6}
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
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-500">
            ¿Ya tienes cuenta?{" "}
            <Link href="/provider/login" className="text-pink-600 hover:underline font-medium">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
