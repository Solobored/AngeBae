"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "../providers"
import { supabase } from "@/lib/supabase/client"

export default function AdminSettings() {
  const { adminEmail } = useAuth()
  const [newEmail, setNewEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (adminEmail) {
      setNewEmail(adminEmail)
    }
  }, [adminEmail])

  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setMessage("")

    if (newPassword && newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      setLoading(false)
      return
    }

    try {
      const updateData: any = { email: newEmail }
      if (newPassword) {
        updateData.password = newPassword
      }

      const { error } = await supabase.from("admin_users").update(updateData).eq("email", adminEmail)

      if (error) {
        setError("Error al actualizar las credenciales")
        console.error(error)
      } else {
        setMessage("Credenciales actualizadas exitosamente")
        // Update localStorage if email changed
        if (newEmail !== adminEmail) {
          localStorage.setItem("admin_email", newEmail)
        }
        setNewPassword("")
        setConfirmPassword("")
      }
    } catch (error) {
      setError("Error al actualizar las credenciales")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Configuración de Administrador</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateCredentials} className="space-y-4">
            {message && (
              <Alert>
                <AlertDescription className="text-green-600">{message}</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email del Administrador</Label>
              <Input
                id="email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="admin@skincarepro.com"
                required
                disabled={loading}
              />
              <p className="text-sm text-gray-500">Este email recibirá todas las notificaciones de pedidos</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Nueva Contraseña (opcional)</Label>
              <Input
                id="password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Dejar vacío para mantener la actual"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmar nueva contraseña"
                disabled={loading || !newPassword}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
              disabled={loading}
            >
              {loading ? "Actualizando..." : "Actualizar Credenciales"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
