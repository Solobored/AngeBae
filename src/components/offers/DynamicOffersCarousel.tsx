"use client"

import { useState, useEffect } from "react"
import { Swiper, SwiperSlide } from "swiper/react"
import { Navigation, Autoplay, Pagination } from "swiper/modules"
import { Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import Image from "next/image"

import "swiper/css"
import "swiper/css/navigation"
import "swiper/css/pagination"

interface Offer {
  id: number
  product_id: number
  product_name: string
  product_image: string
  product_description: string
  original_price: number
  offer_price: number
  discount_percentage: number
  start_date: string
  end_date: string
  is_active: boolean
  position: number
}

interface DynamicOffersCarouselProps {
  onAddToCart: (product: any) => void
}

export function DynamicOffersCarousel({ onAddToCart }: DynamicOffersCarouselProps) {
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOffers()
  }, [])

  const fetchOffers = async () => {
    try {
      const response = await fetch("/api/offers?active=true")
      const data = await response.json()

      if (data.offers && data.offers.length > 0) {
        setOffers(data.offers)
      }
    } catch (error) {
      console.error("Error fetching offers:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = (offer: Offer) => {
    const product = {
      id: offer.product_id,
      name: offer.product_name,
      price: offer.offer_price,
      originalPrice: offer.original_price,
      image: offer.product_image,
      description: offer.product_description,
      isFlashSale: true,
    }
    onAddToCart(product)
  }

  if (loading) {
    return (
      <section className="py-12 bg-red-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center mb-8">
            <Zap className="h-6 w-6 text-red-500 mr-2" />
            <h3 className="text-2xl font-bold text-red-600">Ofertas Especiales</h3>
          </div>
          <div className="flex space-x-4 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-80">
                <Card className="border-red-200 shadow-lg">
                  <div className="h-48 bg-muted shimmer rounded-t-lg" />
                  <CardContent className="p-4">
                    <div className="h-4 bg-muted shimmer rounded mb-2" />
                    <div className="h-3 bg-muted shimmer rounded w-3/4" />
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (offers.length === 0) {
    return null
  }

  return (
    <section className="py-12 bg-gradient-to-r from-red-50 to-pink-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <Zap className="h-6 w-6 text-red-500 mr-2" />
            <h3 className="text-2xl font-bold text-red-600">Ofertas Especiales</h3>
          </div>
        </div>

        <div className="relative">
          {/* Navigation Buttons */}
          <div className="absolute top-1/2 left-0 z-10 -translate-y-1/2">
            <button className="swiper-button-prev-custom bg-white p-3 rounded-full shadow-lg hover:bg-gray-50 transition-colors border border-red-200">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
          <div className="absolute top-1/2 right-0 z-10 -translate-y-1/2">
            <button className="swiper-button-next-custom bg-white p-3 rounded-full shadow-lg hover:bg-gray-50 transition-colors border border-red-200">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <Swiper
            modules={[Navigation, Autoplay, Pagination]}
            navigation={{
              nextEl: ".swiper-button-next-custom",
              prevEl: ".swiper-button-prev-custom",
            }}
            autoplay={{
              delay: 3000,
              disableOnInteraction: false,
            }}
            loop={true}
            pagination={{
              clickable: true,
              el: ".swiper-pagination-custom",
            }}
            spaceBetween={20}
            breakpoints={{
              640: { slidesPerView: 1 },
              768: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
              1280: { slidesPerView: 4 },
            }}
            className="offers-swiper"
          >
            {offers.map((offer) => (
              <SwiperSlide key={offer.id}>
                <Card className="border-red-200 shadow-lg hover:shadow-xl transition-shadow h-full">
                  <CardHeader className="p-0">
                    <div className="relative">
                      <Image
                        src={offer.product_image || "/placeholder.svg?height=200&width=300&query=skincare product"}
                        alt={offer.product_name}
                        width={300}
                        height={200}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                      <Badge className="absolute top-2 left-2 bg-red-500 text-white">
                        -{offer.discount_percentage}% OFF
                      </Badge>
                      <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                        Oferta Limitada
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 flex-grow">
                    <h4 className="font-semibold mb-2 line-clamp-2">{offer.product_name}</h4>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{offer.product_description}</p>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-xl font-bold text-red-600">${offer.offer_price}</span>
                      <span className="text-sm text-gray-500 line-through">${offer.original_price}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Válido hasta: {new Date(offer.end_date).toLocaleDateString("es-ES")}
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <Button
                      onClick={() => handleAddToCart(offer)}
                      className="w-full bg-red-600 hover:bg-red-700 text-white"
                    >
                      Agregar al Carrito
                    </Button>
                  </CardFooter>
                </Card>
              </SwiperSlide>
            ))}
          </Swiper>

          <div className="swiper-pagination-custom flex justify-center mt-6 space-x-2"></div>
        </div>
      </div>

      <style jsx global>{`
        .offers-swiper .swiper-pagination-bullet {
          width: 12px;
          height: 12px;
          background: #ef4444;
          opacity: 0.3;
          transition: all 0.3s ease;
        }
        .offers-swiper .swiper-pagination-bullet-active {
          opacity: 1;
          transform: scale(1.2);
        }
        .swiper-button-prev-custom:hover,
        .swiper-button-next-custom:hover {
          transform: scale(1.05);
        }
      `}</style>
    </section>
  )
}
