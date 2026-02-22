import { describe, it, expect } from "vitest"
import { signupSchema } from "../../app/api/providers/signup/route"

describe("provider signup schema", () => {
  it("accepts valid payload", () => {
    const data = {
      name: "AngeBae",
      email: "demo@example.com",
      password: "secret123",
      contact_info: { phone: "+56 9 1111 1111" },
    }
    expect(() => signupSchema.parse(data)).not.toThrow()
  })

  it("rejects invalid email", () => {
    expect(() => signupSchema.parse({ name: "x", email: "bad", password: "123456" })).toThrow()
  })
})
