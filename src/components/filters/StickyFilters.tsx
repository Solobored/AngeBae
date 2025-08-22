"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface StickyFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  selectedCategory: string
  onCategoryChange: (value: string) => void
  sortBy: string
  onSortChange: (value: string) => void
  categories: Array<{ id: string; name: string }>
}

export function StickyFilters({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  categories,
}: StickyFiltersProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-lg border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          {/* Sticky Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 w-full bg-gray-50 border-gray-200 focus:bg-white focus:border-pink-300 focus:ring-pink-200"
              />
            </div>
          </div>

          {/* Sticky Filters */}
          <div className="flex gap-2">
            <Select value={selectedCategory} onValueChange={onCategoryChange}>
              <SelectTrigger className="w-40 bg-white border-gray-200 hover:border-pink-300 focus:border-pink-500 focus:ring-pink-200">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200">
                {categories.map((category) => (
                  <SelectItem
                    key={category.id}
                    value={category.id}
                    className="hover:bg-pink-50 focus:bg-pink-100 focus:text-pink-900"
                  >
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className="w-40 bg-white border-gray-200 hover:border-pink-300 focus:border-pink-500 focus:ring-pink-200">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200">
                <SelectItem value="featured" className="hover:bg-pink-50 focus:bg-pink-100 focus:text-pink-900">
                  Destacados
                </SelectItem>
                <SelectItem value="price-low" className="hover:bg-pink-50 focus:bg-pink-100 focus:text-pink-900">
                  Precio: Menor a Mayor
                </SelectItem>
                <SelectItem value="price-high" className="hover:bg-pink-50 focus:bg-pink-100 focus:text-pink-900">
                  Precio: Mayor a Menor
                </SelectItem>
                <SelectItem value="rating" className="hover:bg-pink-50 focus:bg-pink-100 focus:text-pink-900">
                  Mejor Valorados
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}
