"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Search, AlertTriangle, CheckCircle } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAdminAuth } from "../../providers"

interface Product {
  id: string
  name: string
  price: number
  slug: string
  created_at: string
}

interface DuplicateGroup {
  products: Product[]
  similarity: number
  priceRange: { min: number; max: number }
}

export default function DuplicatesPage() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading } = useAdminAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [similarityThreshold, setSimilarityThreshold] = useState(80)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/admin/login")
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchProducts()
    }
  }, [authLoading, isAuthenticated])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/products")
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      } else {
        setError("Error al cargar productos")
      }
    } catch (error) {
      setError("Error al cargar productos")
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  const scanForDuplicates = async () => {
    setScanning(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/products/scan-duplicates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          products: products.map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
          })),
          similarityThreshold: similarityThreshold / 100,
        }),
      })

      if (!response.ok) {
        throw new Error("Error al escanear duplicados")
      }

      const result = await response.json()
      setDuplicateGroups(result.duplicateGroups || [])

      if (result.duplicateGroups.length === 0) {
        setSuccess("¡Excelente! No se encontraron productos duplicados.")
      } else {
        setSuccess(`Se encontraron ${result.duplicateGroups.length} grupos de productos similares.`)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error al escanear duplicados")
    } finally {
      setScanning(false)
    }
  }

  const mergeProducts = async (keepProductId: string, removeProductIds: string[]) => {
    try {
      const response = await fetch("/api/products/merge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          keepProductId,
          removeProductIds,
        }),
      })

      if (!response.ok) {
        throw new Error("Error al fusionar productos")
      }

      setSuccess("Productos fusionados exitosamente")
      fetchProducts()
      scanForDuplicates()
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error al fusionar productos")
    }
  }

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 90) return "text-red-600"
    if (similarity >= 80) return "text-orange-600"
    return "text-yellow-600"
  }

  if (authLoading || !isAuthenticated || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Cargando productos...</div>
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
              <h1 className="text-2xl font-bold text-gray-900">Detección de Duplicados</h1>
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

          {/* Scan Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="h-5 w-5" />
                <span>Escanear Productos Duplicados</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <Label htmlFor="similarity">Umbral de Similitud (%)</Label>
                    <Input
                      id="similarity"
                      type="number"
                      min="50"
                      max="100"
                      value={similarityThreshold}
                      onChange={(e) => setSimilarityThreshold(Number.parseInt(e.target.value))}
                      className="w-32"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Productos con {similarityThreshold}% o más de similitud se considerarán duplicados
                    </p>
                  </div>
                  <Button onClick={scanForDuplicates} disabled={scanning} className="bg-pink-600 hover:bg-pink-700">
                    {scanning ? "Escaneando..." : "Escanear Duplicados"}
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{products.length}</div>
                    <div className="text-sm text-blue-800">Total de Productos</div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{duplicateGroups.length}</div>
                    <div className="text-sm text-orange-800">Grupos de Duplicados</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {products.length - duplicateGroups.reduce((acc, group) => acc + group.products.length - 1, 0)}
                    </div>
                    <div className="text-sm text-green-800">Productos Únicos</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Duplicate Groups */}
          {duplicateGroups.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <span>Productos Duplicados Detectados</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {duplicateGroups.map((group, groupIndex) => (
                    <div key={groupIndex} className="border rounded-lg p-4 bg-orange-50">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h3 className="font-medium text-lg">Grupo {groupIndex + 1}</h3>
                          <p className="text-sm text-gray-600">
                            {group.products.length} productos similares (
                            <span className={getSimilarityColor(group.similarity)}>
                              {Math.round(group.similarity)}% similitud
                            </span>
                            )
                          </p>
                        </div>
                        <Badge variant="outline">
                          Precio: ${group.priceRange.min} - ${group.priceRange.max}
                        </Badge>
                      </div>

                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Producto</TableHead>
                              <TableHead>Precio</TableHead>
                              <TableHead>Fecha de Creación</TableHead>
                              <TableHead>Acciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {group.products.map((product, productIndex) => (
                              <TableRow key={product.id}>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">{product.name}</p>
                                    <p className="text-sm text-gray-500">ID: {product.id}</p>
                                  </div>
                                </TableCell>
                                <TableCell className="font-medium">${product.price}</TableCell>
                                <TableCell>{new Date(product.created_at).toLocaleDateString("es-CL")}</TableCell>
                                <TableCell>
                                  {productIndex === 0 ? (
                                    <Badge variant="default" className="bg-green-600">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Mantener
                                    </Badge>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        mergeProducts(
                                          group.products[0].id,
                                          group.products.slice(1).map((p) => p.id),
                                        )
                                      }
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      Fusionar
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      <div className="mt-4 flex justify-end">
                        <Button
                          onClick={() =>
                            mergeProducts(
                              group.products[0].id,
                              group.products.slice(1).map((p) => p.id),
                            )
                          }
                          className="bg-orange-600 hover:bg-orange-700"
                        >
                          Fusionar Todos en Este Grupo
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {duplicateGroups.length === 0 && !scanning && (
            <Card>
              <CardContent className="text-center py-12">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron duplicados</h3>
                <p className="text-gray-600">
                  Todos tus productos parecen ser únicos. ¡Excelente gestión de inventario!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
