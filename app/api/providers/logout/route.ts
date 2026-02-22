import { NextRequest, NextResponse } from "next/server"
import { isProvidersFeatureEnabled } from "@/lib/auth"

export async function POST(_request: NextRequest) {
  if (!isProvidersFeatureEnabled()) {
    return NextResponse.json({ error: "Providers feature disabled" }, { status: 503 })
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set({
    name: "provider_auth",
    value: "",
    path: "/",
    maxAge: 0,
  })
  return response
}
