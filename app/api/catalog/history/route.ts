import { NextResponse } from "next/server"

// Mock data for now - in a real app, this would come from a database
const mockHistory = [
  {
    id: "pdf_1703123456789",
    filename: "catalogo_productos_2024.pdf",
    status: "completed",
    products: [],
    created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
  },
  {
    id: "pdf_1703037056789",
    filename: "nuevos_productos_enero.pdf",
    status: "completed",
    products: [],
    created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
  },
]

export async function GET() {
  try {
    // In a real implementation, fetch from database
    // const { data: history } = await supabase
    //   .from("catalog_processing")
    //   .select("*")
    //   .order("created_at", { ascending: false })

    return NextResponse.json(mockHistory)
  } catch (error) {
    console.error("Error fetching processing history:", error)
    return NextResponse.json({ error: "Error al obtener historial" }, { status: 500 })
  }
}
