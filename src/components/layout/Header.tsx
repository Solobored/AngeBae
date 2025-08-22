"use client"
import { Search, ShoppingCart, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface HeaderProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  cartItemsCount: number
}

export function Header({ searchTerm, onSearchChange, cartItemsCount }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <div className="flex-shrink-0">
            <Link href="/">
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent font-seatyio">
                <span className="hidden lg:inline">angebae & beauty therapist</span>
                <span className="lg:hidden">ABT</span>
              </h1>
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
          <div className="flex items-center space-x-2">
            <Link href="/aprende-a-usarlo">
              <Button variant="ghost" size="sm" className="hidden sm:flex items-center font-inter">
                <BookOpen className="h-4 w-4 mr-2" />
                Aprende a usarlo
              </Button>
            </Link>

            <div className="flex-shrink-0">
              <Link href="/cart">
                <Button variant="outline" size="sm" className="relative bg-transparent hover:bg-gray-50 p-3">
                  <ShoppingCart className="h-5 w-5 sm:h-4 sm:w-4" />
                  {cartItemsCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs bg-gradient-to-r from-pink-600 to-purple-600">
                      {cartItemsCount}
                    </Badge>
                  )}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
