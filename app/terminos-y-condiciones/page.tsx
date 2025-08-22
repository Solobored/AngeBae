import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function TerminosCondiciones() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4" />
              <span>Volver</span>
            </Link>
            <h1 className="text-xl font-semibold">Términos y Condiciones</h1>
            <div></div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold mb-8">Términos y Condiciones de Compra</h1>

          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Información General</h2>
              <p>
                Los presentes términos y condiciones regulan la compra de productos de cuidado personal a través de
                nuestro sitio web SkinCare Pro, en cumplimiento con la Ley N° 19.496 sobre Protección de los Derechos de
                los Consumidores de Chile.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Productos y Precios</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Todos los precios están expresados en pesos chilenos (CLP) e incluyen IVA.</li>
                <li>Los precios pueden variar sin previo aviso.</li>
                <li>Las imágenes de los productos son referenciales.</li>
                <li>Nos reservamos el derecho de limitar las cantidades de compra.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Proceso de Compra</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Al realizar una compra, el cliente acepta estos términos y condiciones.</li>
                <li>La confirmación de compra se enviará al email o teléfono proporcionado.</li>
                <li>El pago se procesa a través de Mercado Pago de forma segura.</li>
                <li>La compra se considera finalizada una vez confirmado el pago.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Entrega y Envíos</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Retiro en punto de venta:</strong> Coordinaremos contigo el lugar y horario de entrega.
                </li>
                <li>
                  <strong>Envío a domicilio:</strong> Los tiempos de entrega son de 2 a 5 días hábiles en la Región
                  Metropolitana.
                </li>
                <li>Los costos de envío se informan antes de finalizar la compra.</li>
                <li>Es responsabilidad del cliente proporcionar datos correctos para la entrega.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Derecho de Retracto</h2>
              <p>
                Conforme a la Ley del Consumidor chilena, tienes derecho a retractarte de tu compra dentro de 10 días
                corridos desde la recepción del producto, siempre que:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>El producto esté en su empaque original y sin usar.</li>
                <li>Se mantengan los sellos de seguridad intactos.</li>
                <li>Se notifique por escrito la intención de retracto.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Garantías</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Todos nuestros productos cuentan con garantía legal de 6 meses.</li>
                <li>Los productos defectuosos serán cambiados sin costo adicional.</li>
                <li>La garantía no cubre mal uso o daños por negligencia del cliente.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Protección de Datos</h2>
              <p>
                Tus datos personales serán tratados conforme a la Ley N° 19.628 sobre Protección de la Vida Privada y
                nuestra Política de Privacidad. Solo utilizaremos tu información para procesar tu pedido y contactarte
                sobre el mismo.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Resolución de Conflictos</h2>
              <p>
                Cualquier controversia será resuelta según la legislación chilena. En caso de conflicto, puedes recurrir
                al SERNAC (Servicio Nacional del Consumidor) o a los tribunales competentes de Chile.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Contacto</h2>
              <p>Para consultas sobre estos términos o tu compra, puedes contactarnos a:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Email: info@skincarepro.com</li>
                <li>WhatsApp: +56 9 1234 5678</li>
              </ul>
            </section>

            <div className="mt-8 p-4 bg-gray-100 rounded-lg">
              <p className="text-sm">
                <strong>Última actualización:</strong> Enero 2024
                <br />
                Al realizar una compra en nuestro sitio, confirmas que has leído, entendido y aceptado estos términos y
                condiciones.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
