"use client"

import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Star, Store } from "lucide-react"

export interface ProductCardProduct {
  id: string | number
  name: string
  price: number
  originalPrice?: number | null
  image?: string | null
  description?: string | null
  category?: string
  isFlashSale?: boolean
  isBestSeller?: boolean
  rating?: number
  reviews?: number
  provider_slug?: string | null
  provider_name?: string | null
}

interface ProductCardProps {
  product: ProductCardProduct
  onAddToCart?: (product: ProductCardProduct) => void
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const imageUrl = product.image || "/placeholder.svg?height=300&width=300"
  const hasProvider = !!(product.provider_slug || product.provider_name)
  const providerName = product.provider_name || "Proveedor"
  const providerSlug = product.provider_slug

  return (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white overflow-hidden">
      <CardContent className="p-0">
        <div className="relative">
          <Image
            src={imageUrl}
            alt={product.name}
            width={300}
            height={300}
            className="w-full h-48 object-cover"
          />
          {product.isFlashSale && <Badge className="absolute top-2 left-2 bg-red-500">OFERTA</Badge>}
          {product.isBestSeller && !product.isFlashSale && (
            <Badge className="absolute top-2 left-2 bg-green-500">BESTSELLER</Badge>
          )}
        </div>
        <div className="p-4">
          <h4 className="font-semibold mb-2 text-gray-900">{product.name}</h4>
          {product.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
          )}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg font-bold text-gray-900">${product.price}</span>
            {product.originalPrice != null && product.originalPrice > product.price && (
              <span className="text-sm text-gray-500 line-through">${product.originalPrice}</span>
            )}
          </div>
          {hasProvider && providerSlug && (
            <Link
              href={`/store/${providerSlug}`}
              className="inline-flex items-center gap-1.5 text-xs text-pink-600 hover:underline mt-1"
            >
              <Store className="h-3.5 w-3.5" />
              Vendido por {providerName}
            </Link>
          )}
          {hasProvider && !providerSlug && (
            <p className="text-xs text-gray-500 mt-1">Vendido por {providerName}</p>
          )}
          {(product.rating != null || product.reviews != null) && (
            <div className="flex items-center gap-1 mt-2">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="text-sm text-gray-600">
                {product.rating ?? "—"}
                {product.reviews != null && ` (${product.reviews})`}
              </span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex flex-col gap-2">
        <Link href={`/producto/${product.id}`} className="w-full">
          <Button variant="outline" className="w-full border-pink-600 text-pink-600 hover:bg-pink-50">
            Ver producto
          </Button>
        </Link>
        {onAddToCart && (
          <Button
            onClick={() => onAddToCart(product)}
            className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Agregar al carrito
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
