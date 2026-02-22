import type { NextRequest } from "next/server"
import jwt, { type JwtPayload } from "jsonwebtoken"
import { querySingle } from "@/lib/db"

export interface AuthenticatedAdmin {
  id: string
  email: string
  name: string | null
}

interface AdminTokenPayload extends JwtPayload {
  adminId: string
  email: string
}

interface ProviderTokenPayload extends JwtPayload {
  userId: string
  providerId: string
  role: "owner" | "manager"
  email: string
  scope: "provider"
}

function getJwtSecret(): string {
  return process.env.JWT_SECRET || "your-secret-key"
}

export function signAdminToken(admin: { id: string; email: string }): string {
  return jwt.sign({ adminId: admin.id, email: admin.email }, getJwtSecret(), {
    expiresIn: "24h",
  })
}

export function verifyAdminToken(token: string): AdminTokenPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret())
    if (
      typeof decoded === "object" &&
      decoded !== null &&
      typeof (decoded as AdminTokenPayload).adminId === "string" &&
      typeof (decoded as AdminTokenPayload).email === "string"
    ) {
      return decoded as AdminTokenPayload
    }

    return null
  } catch {
    return null
  }
}

export async function getAdminSessionFromRequest(request: NextRequest): Promise<AuthenticatedAdmin | null> {
  const token = request.cookies.get("admin_auth")?.value
  if (!token) {
    return null
  }

  const payload = verifyAdminToken(token)
  if (!payload) {
    return null
  }

  const admin = await querySingle<AuthenticatedAdmin & { active: boolean }>(
    "SELECT id, email, name, active FROM admins WHERE id = $1",
    [payload.adminId],
  )

  if (!admin || !admin.active) {
    return null
  }

  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
  }
}

// Provider auth helpers
function getProviderSecret(): string {
  return process.env.PROVIDER_JWT_SECRET || getJwtSecret()
}

export function signProviderToken(params: {
  userId: string
  providerId: string
  role: "owner" | "manager"
  email: string
}): string {
  return jwt.sign(
    {
      userId: params.userId,
      providerId: params.providerId,
      role: params.role,
      email: params.email,
      scope: "provider",
    } satisfies ProviderTokenPayload,
    getProviderSecret(),
    { expiresIn: "24h" },
  )
}

export function verifyProviderToken(token: string): ProviderTokenPayload | null {
  try {
    const decoded = jwt.verify(token, getProviderSecret())
    if (
      typeof decoded === "object" &&
      decoded !== null &&
      (decoded as ProviderTokenPayload).scope === "provider" &&
      typeof (decoded as ProviderTokenPayload).providerId === "string"
    ) {
      return decoded as ProviderTokenPayload
    }
    return null
  } catch {
    return null
  }
}

export interface AuthenticatedProvider {
  userId: string
  providerId: string
  role: "owner" | "manager"
  email: string
}

export async function getProviderSessionFromRequest(request: NextRequest): Promise<AuthenticatedProvider | null> {
  const token =
    request.cookies.get("provider_auth")?.value ||
    (request.headers.get("authorization") || "").replace(/^[Bb]earer\s+/i, "")

  if (!token) return null

  const payload = verifyProviderToken(token)
  if (!payload) return null

  // Ensure user still exists and has membership
  const membership = await querySingle<{ role: string }>(
    `SELECT pu.role
     FROM provider_users pu
     JOIN users u ON u.id = pu.user_id
     WHERE pu.provider_id = $1 AND pu.user_id = $2`,
    [payload.providerId, payload.userId],
  )

  if (!membership) return null

  return {
    userId: payload.userId,
    providerId: payload.providerId,
    role: (membership.role as "owner" | "manager") ?? payload.role,
    email: payload.email,
  }
}

export function isProvidersFeatureEnabled(): boolean {
  const flag = process.env.FEATURE_PROVIDERS
  return flag === undefined || flag === null || flag.toLowerCase() === "true"
}
// User auth helpers (for buyers/customers)
export interface UserTokenPayload extends JwtPayload {
  id: string
  email: string
  type: "user"
}

export function generateToken(payload: { id: string; email: string; type: "user" }): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" })
}

export function verifyTokenWithType(token: string, type: string): UserTokenPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret())
    if (
      typeof decoded === "object" &&
      decoded !== null &&
      (decoded as UserTokenPayload).type === type &&
      typeof (decoded as UserTokenPayload).id === "string" &&
      typeof (decoded as UserTokenPayload).email === "string"
    ) {
      return decoded as UserTokenPayload
    }
    return null
  } catch {
    return null
  }
}