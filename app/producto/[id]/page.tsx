"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, ShoppingCart, Star, Heart, Share2, CheckCircle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Store } from "lucide-react"

// Sample product data - in production this would come from database
const sampleProducts = [
  {
    id: 1,
    name: "Serum Vitamina C Antioxidante",
    price: 2500,
    originalPrice: 3200,
    image: "/placeholder.svg?height=400&width=400",
    category: "serums",
    description: "Serum concentrado con vitamina C para iluminar y proteger la piel",
    longDescription:
      "Este serum concentrado con vitamina C es perfecto para iluminar la piel y protegerla del daño oxidativo. Formulado con ácido L-ascórbico estabilizado al 20%, proporciona una potente acción antioxidante que ayuda a reducir las manchas oscuras y mejora la textura de la piel.",
    benefits: [
      "Ilumina y unifica el tono de la piel",
      "Reduce manchas oscuras y hiperpigmentación",
      "Protege contra el daño de los radicales libres",
      "Estimula la producción de colágeno",
      "Mejora la textura y suavidad de la piel",
    ],
    howToUse: [
      "Limpia tu rostro con tu limpiador habitual",
      "Aplica 2-3 gotas del serum en rostro y cuello",
      "Masajea suavemente hasta completa absorción",
      "Usa siempre protector solar durante el día",
      "Aplica por las mañanas para mejores resultados",
    ],
    ingredients: "Aqua, L-Ascorbic Acid, Propylene Glycol, Hyaluronic Acid, Vitamin E, Ferulic Acid",
    isFlashSale: true,
    isBestSeller: true,
    rating: 4.8,
    reviews: 124,
    stock: 15,
  },
  {
    id: 2,
    name: "Crema Hidratante Ácido Hialurónico",
    price: 1800,
    image: "/placeholder.svg?height=400&width=400",
    category: "cremas",
    description: "Crema ultra hidratante con ácido hialurónico para todo tipo de piel",
    longDescription:
      "Crema hidratante de textura ligera enriquecida con ácido hialurónico de bajo y alto peso molecular. Proporciona hidratación profunda y duradera, manteniendo la piel suave y flexible durante todo el día.",
    benefits: [
      "Hidratación profunda y duradera",
      "Mejora la elasticidad de la piel",
      "Reduce la apariencia de líneas finas",
      "Textura ligera, no grasa",
      "Apta para todo tipo de piel",
    ],
    howToUse: [
      "Aplica sobre rostro limpio",
      "Masajea suavemente con movimientos ascendentes",
      "Usa mañana y noche",
      "Puede usarse bajo maquillaje",
      "Ideal como base para otros tratamientos",
    ],
    ingredients: "Aqua, Hyaluronic Acid, Glycerin, Ceramides, Niacinamide, Panthenol",
    isBestSeller: true,
    rating: 4.6,
    reviews: 89,
    stock: 23,
  },
]

export default function ProductPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<any>(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [cart, setCart] = useState<any[]>([])
  const [isWishlisted, setIsWishlisted] = useState(false)

  useEffect(() => {
    const id = params.id as string
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
    if (isUuid) {
      fetch(`/api/products/${id}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((p) => {
          if (p) {
            setProduct({
              id: p.id,
              name: p.name,
              price: p.price,
              originalPrice: p.original_price,
              image: p.image_url,
              description: p.description,
              longDescription: p.description,
              benefits: [],
              howToUse: [],
              ingredients: "",
              isFlashSale: p.is_flash_sale,
              isBestSeller: p.is_best_seller,
              rating: undefined,
              reviews: undefined,
              stock: p.stock ?? 0,
              provider_slug: p.provider_slug,
              provider_name: p.provider_name,
            })
          }
        })
        .catch(() => {})
    } else {
      const productId = Number.parseInt(id, 10)
      const foundProduct = sampleProducts.find((p) => p.id === productId)
      setProduct(foundProduct ?? null)
    }

    const savedCart = localStorage.getItem("cart")
    if (savedCart) {
      setCart(JSON.parse(savedCart))
    }
  }, [params.id])

  const addToCart = () => {
    if (!product) return

    const updatedCart = [...cart]
    const existing = updatedCart.find((item) => item.id === product.id)

    if (existing) {
      existing.quantity += quantity
    } else {
      updatedCart.push({ ...product, quantity })
    }

    setCart(updatedCart)
    localStorage.setItem("cart", JSON.stringify(updatedCart))

    // Show success message or redirect to cart
    router.push("/cart")
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Producto no encontrado</h2>
          <Link href="/">
            <Button className="bg-gradient-to-r from-pink-600 to-purple-600">Volver a la tienda</Button>
          </Link>
        </div>
      </div>
    )
  }

  const images = [product.image, product.image, product.image] // In production, multiple images

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a la tienda
              </Button>
            </Link>
            <h1 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              ABT
            </h1>
            <Link href="/cart">
              <Button variant="outline" size="sm">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Carrito ({cart.reduce((sum, item) => sum + item.quantity, 0)})
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square relative bg-white rounded-lg shadow-lg overflow-hidden">
              <Image
                src={images[selectedImage] || "/placeholder.svg"}
                alt={product.name}
                fill
                className="object-cover"
              />
              {product.isFlashSale && <Badge className="absolute top-4 left-4 bg-red-500 text-white">OFERTA</Badge>}
              {product.isBestSeller && !product.isFlashSale && (
                <Badge className="absolute top-4 left-4 bg-green-500 text-white">BESTSELLER</Badge>
              )}
            </div>
            <div className="flex space-x-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${
                    selectedImage === index ? "border-pink-500" : "border-gray-200"
                  }`}
                >
                  <Image
                    src={image || "/placeholder.svg"}
                    alt={`${product.name} ${index + 1}`}
                    width={80}
                    height={80}
                    className="object-cover w-full h-full"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <p className="text-gray-600 text-lg">{product.description}</p>
              {product.provider_slug && product.provider_name && (
                <p className="mt-2">
                  <Link
                    href={`/store/${product.provider_slug}`}
                    className="inline-flex items-center gap-1.5 text-sm text-pink-600 hover:underline"
                  >
                    <Store className="h-4 w-4" />
                    Vendido por {product.provider_name}
                  </Link>
                </p>
              )}
            </div>

            {/* Rating */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(product.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium">{product.rating}</span>
              <span className="text-sm text-gray-500">({product.reviews} reseñas)</span>
            </div>

            {/* Price */}
            <div className="flex items-center space-x-4">
              <span className="text-3xl font-bold text-gray-900">${product.price}</span>
              {product.originalPrice && (
                <span className="text-xl text-gray-500 line-through">${product.originalPrice}</span>
              )}
              {product.originalPrice && (
                <Badge className="bg-red-100 text-red-800">
                  {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                </Badge>
              )}
            </div>

            {/* Stock */}
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-green-600 font-medium">
                {product.stock > 10 ? "En stock" : `Solo quedan ${product.stock} unidades`}
              </span>
            </div>

            {/* Quantity and Add to Cart */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <label className="font-medium">Cantidad:</label>
                <div className="flex items-center border rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 hover:bg-gray-100"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 border-x">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="px-3 py-2 hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex space-x-4">
                <Button
                  onClick={addToCart}
                  className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-semibold py-3 text-lg"
                  size="lg"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Agregar al Carrito
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className={isWishlisted ? "text-red-500 border-red-500" : ""}
                >
                  <Heart className={`h-5 w-5 ${isWishlisted ? "fill-current" : ""}`} />
                </Button>
                <Button variant="outline" size="lg">
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-16">
          <Tabs defaultValue="benefits" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="benefits">Beneficios</TabsTrigger>
              <TabsTrigger value="usage">Cómo Usar</TabsTrigger>
              <TabsTrigger value="ingredients">Ingredientes</TabsTrigger>
              <TabsTrigger value="reviews">Reseñas</TabsTrigger>
            </TabsList>

            <TabsContent value="benefits" className="mt-6">
              <Card>
                <CardHeader>
                  <h3 className="text-xl font-semibold">Beneficios del Producto</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-gray-700">{product.longDescription}</p>
                    <ul className="space-y-2">
                      {product.benefits.map((benefit: string, index: number) => (
                        <li key={index} className="flex items-start space-x-2">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="usage" className="mt-6">
              <Card>
                <CardHeader>
                  <h3 className="text-xl font-semibold">Instrucciones de Uso</h3>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-3">
                    {product.howToUse.map((step: string, index: number) => (
                      <li key={index} className="flex items-start space-x-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ingredients" className="mt-6">
              <Card>
                <CardHeader>
                  <h3 className="text-xl font-semibold">Ingredientes</h3>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{product.ingredients}</p>
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">Información importante</p>
                        <p className="text-sm text-blue-700">
                          Realiza una prueba de parche antes del primer uso. Suspende el uso si experimentas irritación.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews" className="mt-6">
              <Card>
                <CardHeader>
                  <h3 className="text-xl font-semibold">Reseñas de Clientes</h3>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-gray-500">Las reseñas se mostrarán aquí próximamente.</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Calificación promedio: {product.rating}/5 basada en {product.reviews} reseñas
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
