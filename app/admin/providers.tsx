"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface AuthContextType {
  isAuthenticated: boolean
  adminEmail: string | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [adminEmail, setAdminEmail] = useState<string | null>(null)

  useEffect(() => {
    // Check if user is already authenticated
    const authStatus = localStorage.getItem("admin_auth")
    const storedEmail = localStorage.getItem("admin_email")
    if (authStatus === "true" && storedEmail) {
      setIsAuthenticated(true)
      setAdminEmail(storedEmail)
    }
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log("Attempting login with:", email)

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey) {
        console.log("Supabase not configured, using hardcoded admin credentials")
        // Fallback to hardcoded admin credentials when Supabase is not available
        if (email === "admin@skincarepro.com" && password === "admin123") {
          setIsAuthenticated(true)
          setAdminEmail(email)
          localStorage.setItem("admin_auth", "true")
          localStorage.setItem("admin_email", email)
          document.cookie = `admin_auth=true; path=/; max-age=86400; SameSite=Lax`
          console.log("Login successful with hardcoded credentials")
          return true
        }
        return false
      }

      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()

      const { data: tableCheck, error: tableError } = await supabase.from("admin_users").select("count").limit(1)

      if (tableError) {
        console.error("Table check error:", tableError)
        // Fallback to hardcoded credentials if database is not accessible
        if (email === "admin@skincarepro.com" && password === "admin123") {
          setIsAuthenticated(true)
          setAdminEmail(email)
          localStorage.setItem("admin_auth", "true")
          localStorage.setItem("admin_email", email)
          document.cookie = `admin_auth=true; path=/; max-age=86400; SameSite=Lax`
          return true
        }
        return false
      }

      const { data, error } = await supabase
        .from("admin_users")
        .select("*")
        .eq("email", email)
        .eq("password", password)
        .single()

      console.log("Supabase response:", { data, error })

      if (error) {
        console.error("Login error:", error)
        if (error.code === "PGRST116") {
          console.log("No admin user found, creating default admin...")
          const { data: insertData, error: insertError } = await supabase
            .from("admin_users")
            .insert([
              {
                name: "Admin",
                email: "admin@skincarepro.com",
                password: "admin123",
              },
            ])
            .select()
            .single()

          if (insertError) {
            console.error("Error creating admin user:", insertError)
            return false
          }

          // Try login again with the newly created user
          if (email === "admin@skincarepro.com" && password === "admin123") {
            setIsAuthenticated(true)
            setAdminEmail(email)
            localStorage.setItem("admin_auth", "true")
            localStorage.setItem("admin_email", email)
            document.cookie = `admin_auth=true; path=/; max-age=86400; SameSite=Lax`
            console.log("Login successful with new admin user")
            return true
          }
        }
        return false
      }

      if (!data) {
        console.log("No user data returned")
        return false
      }

      setIsAuthenticated(true)
      setAdminEmail(email)
      localStorage.setItem("admin_auth", "true")
      localStorage.setItem("admin_email", email)

      document.cookie = `admin_auth=true; path=/; max-age=86400; SameSite=Lax`

      console.log("Login successful, auth state set")
      return true
    } catch (error) {
      console.error("Login error:", error)
      return false
    }
  }

  const logout = () => {
    setIsAuthenticated(false)
    setAdminEmail(null)
    localStorage.removeItem("admin_auth")
    localStorage.removeItem("admin_email")
    // Remove cookie
    document.cookie = "admin_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
  }

  return <AuthContext.Provider value={{ isAuthenticated, adminEmail, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
