"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Upload, FileText, Eye } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"

interface ExtractedProduct {
  name: string
  description: string
  price: number
  original_price?: number
  category: string
  confidence: number
  duplicate?: boolean
}

interface ProcessingResult {
  id: string
  filename: string
  status: "processing" | "completed" | "error"
  products: ExtractedProduct[]
  created_at: string
}

export default function CatalogPage() {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [processingResults, setProcessingResults] = useState<ProcessingResult[]>([])
  const [selectedResult, setSelectedResult] = useState<ProcessingResult | null>(null)
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set())

  useEffect(() => {
    // Check authentication
    const adminAuth = document.cookie.includes("admin_auth=true")
    if (!adminAuth) {
      router.push("/admin/login")
      return
    }
    fetchProcessingHistory()
  }, [router])

  const fetchProcessingHistory = async () => {
    try {
      const response = await fetch("/api/catalog/history")
      if (response.ok) {
        const data = await response.json()
        setProcessingResults(data)
      }
    } catch (error) {
      console.error("Error fetching processing history:", error)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== "application/pdf") {
      setError("Por favor selecciona un archivo PDF válido")
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      setError("El archivo es demasiado grande. Máximo 10MB")
      return
    }

    setUploading(true)
    setError("")
    setSuccess("")

    try {
      const formData = new FormData()
      formData.append("pdf", file)

      const response = await fetch("/api/catalog/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Error al subir el archivo")
      }

      const result = await response.json()
      setSuccess("Archivo subido exitosamente. Procesando...")

      // Start processing
      await processPDF(result.fileId)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error al subir el archivo")
    } finally {
      setUploading(false)
    }
  }

  const processPDF = async (fileId: string) => {
    setProcessing(true)
    try {
      const response = await fetch("/api/catalog/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileId }),
      })

      if (!response.ok) {
        throw new Error("Error al procesar el PDF")
      }

      const result = await response.json()
      setProcessingResults((prev) => [result, ...prev])
      setSelectedResult(result)
      setSuccess("PDF procesado exitosamente. Revisa los productos extraídos.")
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error al procesar el PDF")
    } finally {
      setProcessing(false)
    }
  }

  const handleProductSelection = (index: number, selected: boolean) => {
    const newSelected = new Set(selectedProducts)
    if (selected) {
      newSelected.add(index)
    } else {
      newSelected.delete(index)
    }
    setSelectedProducts(newSelected)
  }

  const importSelectedProducts = async () => {
    if (!selectedResult || selectedProducts.size === 0) {
      setError("Por favor selecciona al menos un producto para importar")
      return
    }

    setProcessing(true)
    try {
      const productsToImport = Array.from(selectedProducts).map((index) => selectedResult.products[index])

      const response = await fetch("/api/catalog/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          products: productsToImport,
          resultId: selectedResult.id,
        }),
      })

      if (!response.ok) {
        throw new Error("Error al importar productos")
      }

      const result = await response.json()
      setSuccess(`${result.imported} productos importados exitosamente`)
      setSelectedProducts(new Set())
      setSelectedResult(null)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error al importar productos")
    } finally {
      setProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      processing: { label: "Procesando", variant: "secondary" as const },
      completed: { label: "Completado", variant: "default" as const },
      error: { label: "Error", variant: "destructive" as const },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.processing
    return <Badge variant={config.variant}>{config.label}</Badge>
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
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Catálogos PDF</h1>
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

          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="h-5 w-5" />
                <span>Subir Catálogo PDF</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-900">
                    Arrastra tu catálogo PDF aquí o haz clic para seleccionar
                  </p>
                  <p className="text-sm text-gray-500">
                    Máximo 10MB. El sistema extraerá automáticamente los productos del PDF.
                  </p>
                </div>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  disabled={uploading || processing}
                  className="hidden"
                  id="pdf-upload"
                />
                <label
                  htmlFor="pdf-upload"
                  className={`mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 cursor-pointer ${
                    uploading || processing ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {uploading ? "Subiendo..." : processing ? "Procesando..." : "Seleccionar PDF"}
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Processing Results */}
          {selectedResult && (
            <Card>
              <CardHeader>
                <CardTitle>Productos Extraídos - {selectedResult.filename}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                      {selectedResult.products.length} productos encontrados. Selecciona los que deseas importar.
                    </p>
                    <div className="space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedProducts(new Set(selectedResult.products.map((_, i) => i)))}
                      >
                        Seleccionar Todos
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setSelectedProducts(new Set())}>
                        Deseleccionar Todos
                      </Button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={selectedProducts.size === selectedResult.products.length}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedProducts(new Set(selectedResult.products.map((_, i) => i)))
                                } else {
                                  setSelectedProducts(new Set())
                                }
                              }}
                            />
                          </TableHead>
                          <TableHead>Producto</TableHead>
                          <TableHead>Precio</TableHead>
                          <TableHead>Categoría</TableHead>
                          <TableHead>Confianza</TableHead>
                          <TableHead>Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedResult.products.map((product, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Checkbox
                                checked={selectedProducts.has(index)}
                                onCheckedChange={(checked) => handleProductSelection(index, checked as boolean)}
                                disabled={product.duplicate}
                              />
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{product.name}</p>
                                <p className="text-sm text-gray-500 truncate max-w-xs">{product.description}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <span className="font-medium">${product.price}</span>
                                {product.original_price && (
                                  <span className="text-sm text-gray-500 line-through ml-2">
                                    ${product.original_price}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{product.category}</TableCell>
                            <TableCell>
                              <Badge variant={product.confidence > 0.8 ? "default" : "secondary"}>
                                {Math.round(product.confidence * 100)}%
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {product.duplicate ? (
                                <Badge variant="destructive">Duplicado</Badge>
                              ) : (
                                <Badge variant="default">Nuevo</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setSelectedResult(null)}>
                      Cancelar
                    </Button>
                    <Button
                      onClick={importSelectedProducts}
                      disabled={selectedProducts.size === 0 || processing}
                      className="bg-pink-600 hover:bg-pink-700"
                    >
                      {processing ? "Importando..." : `Importar ${selectedProducts.size} Productos`}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Processing History */}
          <Card>
            <CardHeader>
              <CardTitle>Historial de Procesamiento</CardTitle>
            </CardHeader>
            <CardContent>
              {processingResults.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No hay archivos procesados aún.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Archivo</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Productos</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processingResults.map((result) => (
                        <TableRow key={result.id}>
                          <TableCell className="font-medium">{result.filename}</TableCell>
                          <TableCell>{getStatusBadge(result.status)}</TableCell>
                          <TableCell>{result.products.length}</TableCell>
                          <TableCell>{new Date(result.created_at).toLocaleDateString("es-CL")}</TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedResult(result)}
                              disabled={result.status !== "completed"}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
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
