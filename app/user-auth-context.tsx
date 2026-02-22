"use client"

import type React from "react"
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

interface UserProfile {
  id: string
  email: string
  name?: string
  phone?: string
}

interface UserAuthContextValue {
  user: UserProfile | null
  isAuthenticated: boolean
  loading: boolean
  refreshSession: () => Promise<void>
  logout: () => Promise<void>
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signup: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>
}

const UserAuthContext = createContext<UserAuthContextValue | undefined>(undefined)

export function UserAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshSession = useCallback(async () => {
    try {
      const response = await fetch("/api/user/session", {
        method: "GET",
        credentials: "include",
      })

      if (!response.ok) {
        setUser(null)
        return
      }

      const data = await response.json()
      if (data?.authenticated && data?.user) {
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    }
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const response = await fetch("/api/user/login", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        })

        const data = await response.json()

        if (!response.ok) {
          return { success: false, error: data.error || "Login failed" }
        }

        await refreshSession()
        return { success: true }
      } catch (error) {
        return { success: false, error: "Network error" }
      }
    },
    [refreshSession],
  )

  const signup = useCallback(
    async (email: string, password: string, name?: string) => {
      try {
        const response = await fetch("/api/user/signup", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        })

        const data = await response.json()

        if (!response.ok) {
          return { success: false, error: data.error || "Signup failed" }
        }

        await refreshSession()
        return { success: true }
      } catch (error) {
        return { success: false, error: "Network error" }
      }
    },
    [refreshSession],
  )

  const logout = useCallback(async () => {
    try {
      await fetch("/api/user/logout", {
        method: "POST",
        credentials: "include",
      })
    } finally {
      setUser(null)
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

  const value = useMemo<UserAuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      loading,
      refreshSession,
      logout,
      login,
      signup,
    }),
    [user, loading, refreshSession, logout, login, signup],
  )

  return <UserAuthContext.Provider value={value}>{children}</UserAuthContext.Provider>
}

export function useUserAuth() {
  const context = useContext(UserAuthContext)
  if (!context) {
    throw new Error("useUserAuth must be used within UserAuthProvider")
  }

  return context
}
