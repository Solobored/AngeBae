"use client"

import type React from "react"
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

interface AdminUser {
  id: string
  email: string
  name: string | null
}

interface AuthContextValue {
  admin: AdminUser | null
  isAuthenticated: boolean
  loading: boolean
  refreshSession: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshSession = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/session", {
        method: "GET",
        credentials: "include",
      })

      if (!response.ok) {
        setAdmin(null)
        return
      }

      const data = await response.json()
      if (data?.authenticated && data?.admin) {
        setAdmin(data.admin)
      } else {
        setAdmin(null)
      }
    } catch {
      setAdmin(null)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "include",
      })
    } finally {
      setAdmin(null)
    }
  }, [])

  useEffect(() => {
    let active = true

    const run = async () => {
      try {
        await refreshSession()
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    run()

    return () => {
      active = false
    }
  }, [refreshSession])

  const value = useMemo<AuthContextValue>(
    () => ({
      admin,
      isAuthenticated: Boolean(admin),
      loading,
      refreshSession,
      logout,
    }),
    [admin, loading, refreshSession, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAdminAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAdminAuth must be used within AuthProvider")
  }

  return context
}
