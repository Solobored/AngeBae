import { describe, it, expect } from "vitest"
import { signProviderToken, verifyProviderToken } from "../../lib/auth"

describe("provider token", () => {
  it("roundtrips provider token payload", () => {
    const token = signProviderToken({
      userId: "11111111-1111-1111-1111-111111111111",
      providerId: "22222222-2222-2222-2222-222222222222",
      role: "owner",
      email: "owner@example.com",
    })
    const decoded = verifyProviderToken(token)
    expect(decoded).toBeTruthy()
    expect(decoded?.providerId).toBe("22222222-2222-2222-2222-222222222222")
    expect(decoded?.role).toBe("owner")
    expect(decoded?.scope).toBe("provider")
  })
})
