"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  BarChart3,
  Upload,
  Video,
  Palette,
  TrendingUp,
  FileText,
  ArrowRight,
  CheckCircle,
} from "lucide-react"

export function AdminLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50 to-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Beauty Therapist Professional
            </h1>
            <div className="flex gap-3">
              <Link href="/admin/login">
                <Button variant="outline">Iniciar Sesión</Button>
              </Link>
              <Link href="/admin/signup">
                <Button className="bg-gradient-to-r from-pink-600 to-purple-600">
                  Crear Cuenta
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight">
                Impulsa tu negocio de <span className="text-pink-600">estética</span> y{" "}
                <span className="text-purple-600">dermatología</span>
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                La plataforma especializada que conecta profesionales con clientes. Vende tus
                productos, gestiona tu inventario y crece tu negocio de forma profesional.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/admin/signup">
                <Button size="lg" className="bg-gradient-to-r from-pink-600 to-purple-600 w-full sm:w-auto">
                  Comienza Gratis <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/admin/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Tengo Cuenta
                </Button>
              </Link>
            </div>

            <div className="pt-8 border-t border-gray-200">
              <p className="text-sm font-semibold text-gray-600 mb-4 uppercase tracking-wide">
                Confían en nosotros
              </p>
              <div className="flex flex-wrap gap-8">
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900">500+</p>
                  <p className="text-sm text-gray-600">Profesionales activos</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900">5000+</p>
                  <p className="text-sm text-gray-600">Clientes mensuales</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900">24/7</p>
                  <p className="text-sm text-gray-600">Soporte profesional</p>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl blur-3xl opacity-20"></div>
              <div className="relative bg-white rounded-2xl shadow-2xl p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900">Tu Panel Profesional</h3>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">📊 Ventas hoy</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">$2,450</p>
                  </div>
                  <div className="p-4 bg-pink-50 rounded-lg">
                    <p className="text-sm text-gray-600">📦 Productos activos</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">24</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600">👥 Clientes atendidos</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">156</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="bg-white py-20 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">¿Qué es Beauty Therapist Professional?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Una plataforma completa diseñada específicamente para profesionales de la estética y
              dermatología
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <CheckCircle className="h-6 w-6 text-pink-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">Marketplace Especializado</h3>
                  <p className="text-gray-600 mt-1">
                    Acceso a una comunidad exclusiva de profesionales y clientes de estética
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <CheckCircle className="h-6 w-6 text-pink-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">Gestión de Inventario</h3>
                  <p className="text-gray-600 mt-1">
                    Control total de tus productos, precios y ofertas en tiempo real
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <CheckCircle className="h-6 w-6 text-pink-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">Panel de Control Intuitivo</h3>
                  <p className="text-gray-600 mt-1">
                    Interfaz fácil de usar para gestionar todos los aspectos de tu negocio
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <CheckCircle className="h-6 w-6 text-purple-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">Contenido Educativo</h3>
                  <p className="text-gray-600 mt-1">
                    Sube videos, guías y contenido para educar a tus clientes
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <CheckCircle className="h-6 w-6 text-purple-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">Métricas y Análisis</h3>
                  <p className="text-gray-600 mt-1">
                    Datos detallados sobre ventas, clientes y rendimiento de productos
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <CheckCircle className="h-6 w-6 text-purple-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">OCR para Catálogos PDF</h3>
                  <p className="text-gray-600 mt-1">
                    Convierte automáticamente tus catálogos en productos listables
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Beneficios para tu Negocio</h2>
          <p className="text-xl text-gray-600">
            Herramientas profesionales diseñadas para hacer crecer tu empresa
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="group hover:shadow-lg transition-shadow bg-white rounded-xl p-8 border border-gray-200">
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-pink-200 transition-colors">
              <BarChart3 className="h-6 w-6 text-pink-600" />
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-3">Métricas de Rendimiento</h3>
            <p className="text-gray-600">
              Visualiza tus ventas, conversiones y proyecciones con dashboards detallados
            </p>
          </div>

          {/* Feature 2 */}
          <div className="group hover:shadow-lg transition-shadow bg-white rounded-xl p-8 border border-gray-200">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
              <Upload className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-3">Gestión de Productos</h3>
            <p className="text-gray-600">
              Crea, edita y organiza tu catálogo con imágenes, descripciones y precios
            </p>
          </div>

          {/* Feature 3 */}
          <div className="group hover:shadow-lg transition-shadow bg-white rounded-xl p-8 border border-gray-200">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
              <Video className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-3">Contenido Multimedia</h3>
            <p className="text-gray-600">
              Sube videos, tutoriales y guías para educar a tus clientes
            </p>
          </div>

          {/* Feature 4 */}
          <div className="group hover:shadow-lg transition-shadow bg-white rounded-xl p-8 border border-gray-200">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-200 transition-colors">
              <Palette className="h-6 w-6 text-indigo-600" />
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-3">Branding Personalizado</h3>
            <p className="text-gray-600">
              Personaliza tu tienda con tu logo, colores y branding profesional
            </p>
          </div>

          {/* Feature 5 */}
          <div className="group hover:shadow-lg transition-shadow bg-white rounded-xl p-8 border border-gray-200">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-3">Crecimiento Garantizado</h3>
            <p className="text-gray-600">
              Acceso a miles de clientes potenciales de nuestro marketplace
            </p>
          </div>

          {/* Feature 6 */}
          <div className="group hover:shadow-lg transition-shadow bg-white rounded-xl p-8 border border-gray-200">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
              <FileText className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-3">OCR Inteligente</h3>
            <p className="text-gray-600">
              Convierte catálogos PDF en productos automáticamente con IA
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-pink-600 to-purple-600 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Comienza a crecer tu negocio hoy
          </h2>
          <p className="text-xl text-pink-100 mb-8">
            Únete a cientos de profesionales que ya están vendiendo en Beauty Therapist
          </p>
          <Link href="/admin/signup">
            <Button
              size="lg"
              className="bg-white text-pink-600 hover:bg-gray-50 font-semibold px-8 py-3"
            >
              Crear Cuenta Profesional <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-white mb-4">Beauty Therapist</h3>
              <p className="text-sm">Plataforma profesional para estéticos y dermatólogos</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Producto</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Características
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Precios
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="/" className="hover:text-white transition">
                    Privacidad
                  </a>
                </li>
                <li>
                  <a href="/" className="hover:text-white transition">
                    Términos
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Contacto</h4>
              <p className="text-sm">soporte@beautytherapist.com</p>
              <p className="text-sm">+56 9 1234-5678</p>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2026 Beauty Therapist Professional. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
