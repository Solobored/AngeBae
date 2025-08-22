import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const supabase = createClient()

    // First, try to sign in with existing user
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // If user doesn't exist and it's the default admin, create the user
      if (email === "admin@skincarepro.com" && password === "admin123") {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:3000"}/admin`,
          },
        })

        if (signUpError) {
          return NextResponse.json({ error: signUpError.message }, { status: 400 })
        }

        // Try to sign in again after creating the user
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (loginError) {
          return NextResponse.json({ error: loginError.message }, { status: 400 })
        }
      } else {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    }

    const cookieStore = cookies()
    const response = NextResponse.redirect(new URL("/admin", request.url))

    return response
  } catch (error) {
    console.error("Admin login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
