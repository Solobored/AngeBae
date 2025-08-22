import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const supabase = createClient()

  await supabase.auth.signOut()

  return NextResponse.redirect(new URL("/admin/login", request.url))
}
