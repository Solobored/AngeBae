"use client"

import type React from "react"

import { AuthProvider } from "./providers"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthProvider>{children}</AuthProvider>
}
