"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Plus, Edit, Trash2, Package } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Category {
  id: number
  name: string
  slug: string
  description?: string
  product_count?: number
  is_active: boolean
  created_at: string
}

interface Product {
  id: number
  name: string
  category_id?: number
  price: number
}

export default function CategoriesPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showMoveDialog, setShowMoveDialog] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<number[]>([])
  const [targetCategoryId, setTargetCategoryId] = useState<string>("")

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })

  useEffect(() => {
    // Check authentication
    const adminAuth = document.cookie.includes("admin_auth=true")
    if (!adminAuth) {
      router.push("/admin/login")
      return
    }
    fetchData()
  }, [router])

  const fetchData = async () => {
    try {
      setLoading(true)
      await Promise.all([fetchCategories(), fetchProducts()])
    } catch (error) {
      setError("Error al cargar los datos")
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories")
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products")
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      console.error("Error fetching products:", error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .trim()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    try {
      const slug = generateSlug(formData.name)
      const categoryData = {
        ...formData,
        slug,
        is_active: true,
      }

      let response
      if (editingCategory) {
        response = await fetch(`/api/categories/${editingCategory.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(categoryData),
        })
      } else {
        response = await fetch("/api/categories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(categoryData),
        })
      }

      if (!response.ok) {
        throw new Error("Error al guardar la categoría")
      }

      setSuccess(editingCategory ? "Categoría actualizada exitosamente" : "Categoría creada exitosamente")
      setFormData({ name: "", description: "" })
      setEditingCategory(null)
      setShowAddDialog(false)
      fetchCategories()
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error al guardar la categoría")
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || "",
    })
    setShowAddDialog(true)
  }

  const handleDelete = async (categoryId: number) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta categoría?")) {
      return
    }

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Error al eliminar la categoría")
      }

      setSuccess("Categoría eliminada exitosamente")
      fetchCategories()
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error al eliminar la categoría")
    }
  }

  const handleMoveProducts = async () => {
    if (selectedProducts.length === 0 || !targetCategoryId) {
      setError("Selecciona productos y una categoría de destino")
      return
    }

    try {
      const response = await fetch("/api/products/move-category", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productIds: selectedProducts,
          categoryId: Number.parseInt(targetCategoryId),
        }),
      })

      if (!response.ok) {
        throw new Error("Error al mover productos")
      }

      setSuccess(`${selectedProducts.length} productos movidos exitosamente`)
      setSelectedProducts([])
      setTargetCategoryId("")
      setShowMoveDialog(false)
      fetchData()
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error al mover productos")
    }
  }

  const getProductCountForCategory = (categoryId: number) => {
    return products.filter((product) => product.category_id === categoryId).length
  }

  const getProductsWithoutCategory = () => {
    return products.filter((product) => !product.category_id)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Cargando categorías...</div>
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
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Categorías</h1>
            </div>
            <div className="flex space-x-2">
              <Button onClick={() => setShowMoveDialog(true)} variant="outline" className="flex items-center space-x-2">
                <Package className="h-4 w-4" />
                <span>Mover Productos</span>
              </Button>
              <Button
                onClick={() => {
                  setEditingCategory(null)
                  setFormData({ name: "", description: "" })
                  setShowAddDialog(true)
                }}
                className="bg-pink-600 hover:bg-pink-700 flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Nueva Categoría</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {/* Categories Table */}
          <Card>
            <CardHeader>
              <CardTitle>Categorías Existentes</CardTitle>
            </CardHeader>
            <CardContent>
              {categories.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No hay categorías creadas aún.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Productos</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.map((category) => (
                        <TableRow key={category.id}>
                          <TableCell className="font-medium">{category.name}</TableCell>
                          <TableCell className="max-w-xs truncate">{category.description || "-"}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{getProductCountForCategory(category.id)} productos</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={category.is_active ? "default" : "secondary"}>
                              {category.is_active ? "Activa" : "Inactiva"}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(category.created_at).toLocaleDateString("es-CL")}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" onClick={() => handleEdit(category)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(category.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
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

          {/* Products without category */}
          {getProductsWithoutCategory().length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Productos sin Categoría</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Estos productos no tienen categoría asignada. Puedes moverlos usando el botón "Mover Productos".
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getProductsWithoutCategory().map((product) => (
                    <div key={product.id} className="border rounded-lg p-4">
                      <h4 className="font-medium">{product.name}</h4>
                      <p className="text-sm text-gray-600">${product.price}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add/Edit Category Dialog */}
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCategory ? "Editar Categoría" : "Nueva Categoría"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nombre de la Categoría *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Ej: Serums, Cremas, Limpiadores"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe esta categoría de productos..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-pink-600 hover:bg-pink-700">
                    {editingCategory ? "Actualizar" : "Crear"} Categoría
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Move Products Dialog */}
          <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Mover Productos entre Categorías</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Seleccionar Productos</Label>
                  <div className="max-h-60 overflow-y-auto border rounded-md p-4 space-y-2">
                    {products.map((product) => (
                      <div key={product.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`product-${product.id}`}
                          checked={selectedProducts.includes(product.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProducts((prev) => [...prev, product.id])
                            } else {
                              setSelectedProducts((prev) => prev.filter((id) => id !== product.id))
                            }
                          }}
                          className="rounded"
                        />
                        <label htmlFor={`product-${product.id}`} className="flex-1 cursor-pointer">
                          <span className="font-medium">{product.name}</span>
                          <span className="text-sm text-gray-500 ml-2">
                            (
                            {product.category_id
                              ? categories.find((c) => c.id === product.category_id)?.name || "Sin categoría"
                              : "Sin categoría"}
                            )
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Categoría de Destino</Label>
                  <Select value={targetCategoryId} onValueChange={setTargetCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowMoveDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleMoveProducts} className="bg-pink-600 hover:bg-pink-700">
                    Mover {selectedProducts.length} Productos
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  )
}
