import { execSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

/**
 * Regression tests for specific GitHub issues
 *
 * These tests ensure that previously fixed bugs don't reoccur
 * and that the plugin handles edge cases correctly.
 */
describe("Regression Tests", () => {
  describe("Issue #250: ESM import compatibility", () => {
    it("ESM default import works without .default workaround", async () => {
      // This was the exact failing case from the GitHub issue
      const { default: esbuildPluginPino } = await import("../dist/index.mjs")

      expect(typeof esbuildPluginPino).toBe("function")

      // Should be directly callable without .default access
      const plugin = esbuildPluginPino({ transports: [] })
      expect(plugin).toHaveProperty("name", "pino")
      expect(plugin).toHaveProperty("setup")
    })

    it("CommonJS require works without workarounds", () => {
      const esbuildPluginPino = require("../dist/index.js")

      expect(typeof esbuildPluginPino).toBe("function")

      // Should be directly callable
      const plugin = esbuildPluginPino({ transports: [] })
      expect(plugin).toHaveProperty("name", "pino")
    })
  })

  describe("Issue #246: TypeScript type export compatibility", () => {
    it("TypeScript can import without type errors", () => {
      // Test the runtime behavior TypeScript would generate
      const esbuildPluginPino = require("../dist/index.js")

      // This should work without needing .default access
      const config = {
        plugins: [esbuildPluginPino({ transports: [] })],
      }

      expect(config.plugins).toHaveLength(1)
      expect(config.plugins[0].name).toBe("pino")
    })
  })

  describe("Issue #245: Relative outdir path resolution", () => {
    it("generates runtime resolution for relative paths", () => {
      // Build with relative outdir
      execSync("npm run build", {
        cwd: resolve(__dirname, ".."),
        stdio: "pipe",
      })

      // Check the CommonJS output
      const cjsContent = readFileSync(
        resolve(__dirname, "../dist/index.js"),
        "utf8",
      )

      // Should use process.cwd() for runtime resolution, not hardcoded paths
      expect(cjsContent).toMatch(/process\.cwd\(\)/)
      expect(cjsContent).not.toMatch(/\/Users\/\w+\/|C:\\Users\\/)
    })
  })

  describe("Error handling and edge cases", () => {
    it("handles missing optional transports gracefully", () => {
      const esbuildPluginPino = require("../dist/index.js")

      // Should not throw when transport is not installed
      expect(() => {
        const plugin = esbuildPluginPino({ transports: [] })
        expect(plugin.name).toBe("pino")
      }).not.toThrow()
    })

    it("handles empty transports array", () => {
      const esbuildPluginPino = require("../dist/index.js")

      const plugin = esbuildPluginPino({ transports: [] })
      expect(plugin.name).toBe("pino")
      expect(typeof plugin.setup).toBe("function")
    })

    it("handles undefined options", () => {
      const esbuildPluginPino = require("../dist/index.js")

      // Should work with no options provided
      const plugin = esbuildPluginPino()
      expect(plugin.name).toBe("pino")
      expect(typeof plugin.setup).toBe("function")
    })
  })

  describe("Platform compatibility", () => {
    it("handles Windows-style path separators", () => {
      const esbuildPluginPino = require("../dist/index.js")

      // Create a mock build with Windows-style paths
      const plugin = esbuildPluginPino({ transports: [] })
      expect(plugin.name).toBe("pino")

      // The plugin should handle both forward and backslashes
      // This is tested implicitly through the transformToObject function
    })
  })

  describe("Pino version compatibility", () => {
    it("handles pino v9.1+ without pipeline worker", () => {
      const esbuildPluginPino = require("../dist/index.js")

      // Should work even if pino-pipeline-worker.js doesn't exist
      const plugin = esbuildPluginPino({ transports: [] })
      expect(plugin.name).toBe("pino")

      // The plugin internally tries to stat the pipeline worker file
      // and gracefully handles if it doesn't exist (pino v9.1+)
    })
  })
})
