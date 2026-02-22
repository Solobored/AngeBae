"use client"
import { Search, ShoppingCart, BookOpen, User, Lock, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"
import { useUserAuth } from "@/app/user-auth-context"
import { useRouter } from "next/navigation"

interface HeaderProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  cartItemsCount: number
  brand?: {
    logoUrl?: string
    siteTitle?: string
    subtitle?: string
  }
}

export function Header({ searchTerm, onSearchChange, cartItemsCount, brand }: HeaderProps) {
  const { isAuthenticated, user, logout, loading } = useUserAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.refresh()
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <div className="flex-shrink-0">
            <Link href="/">
              {brand?.logoUrl ? (
                <div className="flex items-center gap-2">
                  <Image src={brand.logoUrl} alt={brand.siteTitle || "Proveedor"} width={36} height={36} className="rounded-full object-cover" />
                  <div className="leading-tight">
                    <p className="font-semibold text-sm">{brand.siteTitle || "Proveedor"}</p>
                    <p className="text-xs text-gray-500">{brand.subtitle || "Parte de Beauty Therapist"}</p>
                  </div>
                </div>
              ) : (
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent font-seatyio">
                  <span className="hidden lg:inline">angebae & beauty therapist</span>
                  <span className="lg:hidden">ABT</span>
                </h1>
              )}
            </Link>
          </div>

          <div className="flex-1 max-w-2xl mx-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-12 pr-4 py-4 text-lg w-full bg-gray-50 border-gray-200 focus:bg-white focus:border-pink-300 focus:ring-pink-200 rounded-lg font-inter"
              />
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/aprende-a-usarlo">
              <Button variant="ghost" size="sm" className="hidden sm:flex items-center font-inter">
                <BookOpen className="h-4 w-4 mr-2" />
                Aprende
              </Button>
            </Link>

            {!loading && (
              <>
                {isAuthenticated ? (
                  <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center text-sm text-gray-600 px-3">
                      {user?.name || user?.email}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="hidden sm:flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-pink-600 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Salir
                    </button>
                  </div>
                ) : (
                  <>
                    <Link href="/account/login" className="hidden sm:block">
                      <Button variant="ghost" size="sm" className="items-center font-inter text-gray-600 hover:text-pink-600">
                        <User className="h-4 w-4 mr-1.5" />
                        Iniciar sesión
                      </Button>
                    </Link>

                    <Link href="/account/signup" className="hidden sm:block">
                      <Button size="sm" className="bg-gradient-to-r from-pink-600 to-purple-600 text-white font-inter">
                        Crear cuenta
                      </Button>
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
