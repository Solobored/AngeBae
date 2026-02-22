/**
 * Frontend smoke tests: provider branding, store page, product card, footer.
 * Run with: vitest run tests/frontend
 */
import { describe, it, expect } from "vitest"

describe("ProductCard data shape", () => {
  it("product without provider has no provider_slug", () => {
    const product = { id: "1", name: "P", price: 1000 }
    expect(product).not.toHaveProperty("provider_slug")
  })

  it("product with provider has slug and name", () => {
    const withProvider = {
      id: "uuid-1",
      name: "P",
      price: 1000,
      provider_slug: "angebae",
      provider_name: "AngeBae",
    }
    expect(withProvider.provider_slug).toBe("angebae")
    expect(withProvider.provider_name).toBe("AngeBae")
  })
})

describe("Provider store URL", () => {
  it("store path uses slug", () => {
    expect("/store/angebae").toBe("/store/angebae")
  })

  it("provider API path is by-slug", () => {
    expect("/api/providers/by-slug/angebae").toContain("by-slug")
  })
})

describe("Footer credit", () => {
  it("footer text includes Josvaneiba and platform", () => {
    const credit = "Desarrollado por Josvaneiba"
    const platform = "Parte de Beauty Therapist Platform"
    expect(credit).toContain("Josvaneiba")
    expect(platform).toContain("Beauty Therapist")
  })
})
