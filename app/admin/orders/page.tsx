"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Mail, Eye, Phone } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Order {
  id: number
  customer_name: string
  customer_email: string
  customer_phone: string
  total: string
  order_status: string
  delivery_method: string
  created_at: string
  order_items: any[]
}

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [emailMessage, setEmailMessage] = useState("")
  const [emailSubject, setEmailSubject] = useState("")
  const [sendingEmail, setSendingEmail] = useState(false)

  useEffect(() => {
    // Check authentication
    const adminAuth = document.cookie.includes("admin_auth=true")
    if (!adminAuth) {
      router.push("/admin/login")
      return
    }
    fetchOrders()
  }, [router])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/orders")
      if (response.ok) {
        const data = await response.json()
        setOrders(data)
      } else {
        setError("Error al cargar los pedidos")
      }
    } catch (error) {
      setError("Error al cargar los pedidos")
      console.error("Error fetching orders:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ order_status: newStatus }),
      })

      if (response.ok) {
        fetchOrders() // Refresh orders
      } else {
        setError("Error al actualizar el estado del pedido")
      }
    } catch (error) {
      setError("Error al actualizar el estado del pedido")
      console.error("Error updating order status:", error)
    }
  }

  const sendEmail = async () => {
    if (!selectedOrder || !emailMessage || !emailSubject) {
      setError("Por favor completa todos los campos del email")
      return
    }

    setSendingEmail(true)
    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: selectedOrder.customer_email,
          subject: emailSubject,
          message: emailMessage,
          orderId: selectedOrder.id,
        }),
      })

      if (response.ok) {
        setEmailMessage("")
        setEmailSubject("")
        setSelectedOrder(null)
        alert("Email enviado exitosamente")
      } else {
        setError("Error al enviar el email")
      }
    } catch (error) {
      setError("Error al enviar el email")
      console.error("Error sending email:", error)
    } finally {
      setSendingEmail(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pendiente", variant: "secondary" as const },
      processing: { label: "Procesando", variant: "default" as const },
      shipped: { label: "Enviado", variant: "default" as const },
      delivered: { label: "Entregado", variant: "default" as const },
      cancelled: { label: "Cancelado", variant: "destructive" as const },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-CL", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Cargando pedidos...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => router.back()} className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Volver</span>
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Pedidos</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Pedidos Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No hay pedidos aún.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Contacto</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Entrega</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>#{order.id}</TableCell>
                          <TableCell className="font-medium">{order.customer_name}</TableCell>
                          <TableCell>
                            <div className="flex flex-col space-y-1">
                              <span className="text-sm">{order.customer_email}</span>
                              <span className="text-sm text-gray-500">{order.customer_phone}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">${order.total}</TableCell>
                          <TableCell>{getStatusBadge(order.order_status)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{order.delivery_method === "pickup" ? "Retiro" : "Envío"}</Badge>
                          </TableCell>
                          <TableCell>{formatDate(order.created_at)}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Detalles del Pedido #{order.id}</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label>Cliente</Label>
                                        <p className="font-medium">{order.customer_name}</p>
                                      </div>
                                      <div>
                                        <Label>Email</Label>
                                        <p>{order.customer_email}</p>
                                      </div>
                                      <div>
                                        <Label>Teléfono</Label>
                                        <p>{order.customer_phone}</p>
                                      </div>
                                      <div>
                                        <Label>Estado</Label>
                                        <div className="mt-1">
                                          <Select
                                            value={order.order_status}
                                            onValueChange={(value) => updateOrderStatus(order.id, value)}
                                          >
                                            <SelectTrigger className="w-full">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="pending">Pendiente</SelectItem>
                                              <SelectItem value="processing">Procesando</SelectItem>
                                              <SelectItem value="shipped">Enviado</SelectItem>
                                              <SelectItem value="delivered">Entregado</SelectItem>
                                              <SelectItem value="cancelled">Cancelado</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>
                                    </div>
                                    <div>
                                      <Label>Total</Label>
                                      <p className="text-2xl font-bold text-green-600">${order.total}</p>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>

                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedOrder(order)
                                      setEmailSubject(`Actualización de tu pedido #${order.id}`)
                                      setEmailMessage(
                                        `Hola ${order.customer_name},\n\nTe escribimos para informarte sobre el estado de tu pedido #${order.id}.\n\n[Escribe aquí tu mensaje personalizado]\n\nSaludos,\nEquipo angebae & beauty therapist`,
                                      )
                                    }}
                                  >
                                    <Mail className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Enviar Email a {selectedOrder?.customer_name}</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor="email-subject">Asunto</Label>
                                      <input
                                        id="email-subject"
                                        type="text"
                                        value={emailSubject}
                                        onChange={(e) => setEmailSubject(e.target.value)}
                                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                                        placeholder="Asunto del email"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="email-message">Mensaje</Label>
                                      <Textarea
                                        id="email-message"
                                        value={emailMessage}
                                        onChange={(e) => setEmailMessage(e.target.value)}
                                        rows={8}
                                        placeholder="Escribe tu mensaje aquí..."
                                      />
                                    </div>
                                    <div className="flex justify-end space-x-2">
                                      <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                                        Cancelar
                                      </Button>
                                      <Button onClick={sendEmail} disabled={sendingEmail}>
                                        {sendingEmail ? "Enviando..." : "Enviar Email"}
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>

                              <Button variant="outline" size="sm" asChild>
                                <a href={`tel:${order.customer_phone}`}>
                                  <Phone className="h-4 w-4" />
                                </a>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
