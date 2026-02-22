import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  test: {
    include: ["tests/**/*.ts"],
    globals: true,
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
      "@/lib": path.resolve(__dirname, "lib"),
      "@/app": path.resolve(__dirname, "app"),
      "@/components": path.resolve(__dirname, "components"),
      "@/types": path.resolve(__dirname, "types"),
    },
  },
})
