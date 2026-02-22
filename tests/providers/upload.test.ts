import { describe, it } from "vitest"

// Integration test placeholder – requires running backend + storage.
// Keeping skipped to avoid failing local runs without services.
describe.skip("media upload with provider scope", () => {
  it("should associate media with provider", async () => {
    // This test would call /api/media/upload with provider_auth cookie
    // and assert provider_id is stored. Skipped for now.
  })
})
