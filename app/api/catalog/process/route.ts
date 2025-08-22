import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import { join } from "path"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { fileId } = await request.json()

    if (!fileId) {
      return NextResponse.json({ error: "File ID requerido" }, { status: 400 })
    }

    // Get file info from temporary storage or reconstruct path
    const uploadsDir = join(process.cwd(), "uploads")
    const files = require("fs").readdirSync(uploadsDir)
    const pdfFile = files.find((f: string) => f.includes(fileId.replace("pdf_", "")))

    if (!pdfFile) {
      return NextResponse.json({ error: "Archivo PDF no encontrado" }, { status: 404 })
    }

    const filepath = join(uploadsDir, pdfFile)

    // Process PDF with Python script
    const result = await processPDFWithPython(filepath)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    // Check for duplicates
    const productsWithDuplicateCheck = await checkForDuplicates(result.products)

    // Save processing result to database
    const processingResult = {
      id: fileId,
      filename: pdfFile,
      status: "completed",
      products: productsWithDuplicateCheck,
      created_at: new Date().toISOString(),
    }

    // Store in database (you might want to create a catalog_processing table)
    // For now, we'll return the result directly

    return NextResponse.json(processingResult)
  } catch (error) {
    console.error("Error processing PDF:", error)
    return NextResponse.json({ error: "Error al procesar el PDF" }, { status: 500 })
  }
}

function processPDFWithPython(filepath: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const pythonScript = join(process.cwd(), "scripts", "pdf_processor.py")
    const pythonProcess = spawn("python", [pythonScript, filepath])

    let output = ""
    let errorOutput = ""

    pythonProcess.stdout.on("data", (data) => {
      output += data.toString()
    })

    pythonProcess.stderr.on("data", (data) => {
      errorOutput += data.toString()
    })

    pythonProcess.on("close", (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(output)
          resolve(result)
        } catch (error) {
          reject(new Error("Error parsing Python output"))
        }
      } else {
        reject(new Error(`Python script failed: ${errorOutput}`))
      }
    })

    pythonProcess.on("error", (error) => {
      reject(new Error(`Failed to start Python process: ${error.message}`))
    })
  })
}

async function checkForDuplicates(products: any[]) {
  // Check against existing products in database
  const { data: existingProducts } = await supabase.from("products").select("name, slug").eq("is_active", true)

  const existingNames = new Set(existingProducts?.map((p) => p.name.toLowerCase()) || [])

  return products.map((product) => ({
    ...product,
    duplicate: existingNames.has(product.name.toLowerCase()),
  }))
}
