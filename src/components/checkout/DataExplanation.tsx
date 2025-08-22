"use client"

import { HelpCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface DataExplanationProps {
  field: string
}

const explanations = {
  name: "Necesitamos tu nombre completo para personalizar tu experiencia y para el envío del producto.",
  rut: "El RUT es requerido por ley chilena para la facturación y garantía de los productos.",
  email: "Tu email es importante para enviarte la confirmación de compra, seguimiento del envío y soporte post-venta.",
  phone: "Tu teléfono nos permite contactarte en caso de dudas sobre tu pedido o problemas con la entrega.",
  address:
    "La dirección de envío es necesaria para hacer llegar tu pedido de forma segura y en el menor tiempo posible.",
  region: "La región nos ayuda a calcular los costos de envío y tiempos de entrega más precisos.",
  comuna: "La comuna específica es requerida por las empresas de courier para la entrega correcta del producto.",
}

export function DataExplanation({ field }: DataExplanationProps) {
  const explanation = explanations[field as keyof typeof explanations]

  if (!explanation) return null

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-sm">{explanation}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
