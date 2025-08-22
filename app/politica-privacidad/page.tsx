import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function PoliticaPrivacidad() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4" />
              <span>Volver</span>
            </Link>
            <h1 className="text-xl font-semibold">Política de Privacidad</h1>
            <div></div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold mb-8">Política de Privacidad</h1>

          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Información que Recopilamos</h2>
              <p>Recopilamos la siguiente información personal:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>
                  <strong>Información de contacto:</strong> Email y/o número de teléfono
                </li>
                <li>
                  <strong>Información de compra:</strong> Productos seleccionados, método de entrega
                </li>
                <li>
                  <strong>Información técnica:</strong> Dirección IP, tipo de navegador (de forma anónima)
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Uso de la Información</h2>
              <p>Utilizamos tu información personal para:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Procesar y gestionar tus pedidos</li>
                <li>Contactarte sobre el estado de tu compra</li>
                <li>Coordinar la entrega de productos</li>
                <li>Proporcionar atención al cliente</li>
                <li>Cumplir con obligaciones legales</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Compartir Información</h2>
              <p>
                No vendemos, alquilamos ni compartimos tu información personal con terceros, excepto en los siguientes
                casos:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Con procesadores de pago (Mercado Pago) para completar transacciones</li>
                <li>Con servicios de entrega para coordinar envíos</li>
                <li>Cuando sea requerido por ley o autoridades competentes</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Seguridad de Datos</h2>
              <p>
                Implementamos medidas de seguridad técnicas y organizacionales para proteger tu información personal
                contra acceso no autorizado, alteración, divulgación o destrucción.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Tus Derechos</h2>
              <p>Conforme a la Ley N° 19.628, tienes derecho a:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Conocer qué información personal tenemos sobre ti</li>
                <li>Solicitar la corrección de datos inexactos</li>
                <li>Solicitar la eliminación de tus datos personales</li>
                <li>Oponerte al tratamiento de tus datos</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Retención de Datos</h2>
              <p>
                Conservamos tu información personal solo durante el tiempo necesario para cumplir con los fines para los
                cuales fue recopilada y según lo requiera la ley chilena.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Cookies</h2>
              <p>
                Nuestro sitio web utiliza cookies técnicas necesarias para el funcionamiento del carrito de compras. No
                utilizamos cookies de seguimiento o publicitarias.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Contacto</h2>
              <p>Para ejercer tus derechos o consultas sobre esta política, contáctanos:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Email: privacidad@skincarepro.com</li>
                <li>WhatsApp: +56 9 1234 5678</li>
              </ul>
            </section>

            <div className="mt-8 p-4 bg-gray-100 rounded-lg">
              <p className="text-sm">
                <strong>Última actualización:</strong> Enero 2024
                <br />
                Nos reservamos el derecho de actualizar esta política. Los cambios serán notificados en nuestro sitio
                web.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
