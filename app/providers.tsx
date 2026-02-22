"use client"

import type React from "react"
import { UserAuthProvider } from "./user-auth-context"

export function Providers({ children }: { children: React.ReactNode }) {
  return <UserAuthProvider>{children}</UserAuthProvider>
}
