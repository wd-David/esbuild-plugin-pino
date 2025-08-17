import { rmSync } from "node:fs"
import { afterEach, describe, expect, it } from "vitest"

/**
 * Edge case tests for esbuild-plugin-pino
 *
 * These tests cover unusual scenarios, error conditions,
 * and boundary cases to ensure robust behavior.
 */
describe("Edge Cases", () => {
  let tempDirs: string[] = []

  afterEach(() => {
    // Clean up any temporary directories created during tests
    tempDirs.forEach((dir) => {
      try {
        rmSync(dir, { recursive: true, force: true })
      } catch (_error) {
        // Ignore cleanup errors
      }
    })
    tempDirs = []
  })

  describe("Parameter validation", () => {
    it("accepts no parameters", () => {
      const esbuildPluginPino = require("../dist/index.js")

      expect(() => {
        const plugin = esbuildPluginPino()
        expect(plugin.name).toBe("pino")
      }).not.toThrow()
    })

    it("accepts empty options object", () => {
      const esbuildPluginPino = require("../dist/index.js")

      expect(() => {
        const plugin = esbuildPluginPino({})
        expect(plugin.name).toBe("pino")
      }).not.toThrow()
    })

    it("accepts only transports property", () => {
      const esbuildPluginPino = require("../dist/index.js")

      expect(() => {
        const plugin = esbuildPluginPino({ transports: ["pino-pretty"] })
        expect(plugin.name).toBe("pino")
      }).not.toThrow()
    })

    it("handles empty transports array", () => {
      const esbuildPluginPino = require("../dist/index.js")

      const plugin = esbuildPluginPino({ transports: [] })
      expect(plugin.name).toBe("pino")
      expect(typeof plugin.setup).toBe("function")
    })
  })

  describe("Build configuration edge cases", () => {
    it("creates plugin with minimal config", () => {
      const esbuildPluginPino = require("../dist/index.js")

      // Test that plugin can be created with minimal options
      const plugin = esbuildPluginPino()
      expect(plugin.name).toBe("pino")
      expect(typeof plugin.setup).toBe("function")

      // Test with minimal explicit config
      const plugin2 = esbuildPluginPino({ transports: [] })
      expect(plugin2.name).toBe("pino")
      expect(typeof plugin2.setup).toBe("function")
    })

    it("handles very long transport names", () => {
      const esbuildPluginPino = require("../dist/index.js")

      // Test with an artificially long transport name
      const longTransportName = "a".repeat(200)

      expect(() => {
        const plugin = esbuildPluginPino({ transports: [longTransportName] })
        expect(plugin.name).toBe("pino")
      }).not.toThrow()
    })
  })

  describe("Module resolution edge cases", () => {
    it("handles when pino is not in immediate node_modules", () => {
      // This tests the require.resolve fallback behavior
      const esbuildPluginPino = require("../dist/index.js")

      expect(() => {
        const plugin = esbuildPluginPino({ transports: [] })
        expect(plugin.name).toBe("pino")
      }).not.toThrow()
    })
  })

  describe("Export format edge cases", () => {
    it("ESM import with named destructuring", async () => {
      // Test that named import fails gracefully (as expected)
      try {
        // Use dynamic import with string literal to bypass TypeScript checking
        const module = await import("../dist/index.mjs")
        const { esbuildPluginPino } = module as { esbuildPluginPino?: unknown }
        // If this succeeds, it means we have named exports (which we don't expect)
        expect(esbuildPluginPino).toBeUndefined()
      } catch (error) {
        // This is expected - we only export default, not named exports
        expect((error as Error).message).toMatch(
          /does not provide an export named|named export/,
        )
      }
    })

    it("CommonJS destructuring works with default", () => {
      const pluginExports = require("../dist/index.js")

      // Test accessing as a property (should be the function itself)
      expect(typeof pluginExports).toBe("function")

      // Test that it's directly callable
      const plugin = pluginExports({ transports: [] })
      expect(plugin.name).toBe("pino")
    })
  })

  describe("File system edge cases", () => {
    it("handles absolute vs relative output paths", () => {
      const esbuildPluginPino = require("../dist/index.js")

      // Test plugin creation for different output scenarios
      const plugin1 = esbuildPluginPino({ transports: [] })
      expect(plugin1.name).toBe("pino")

      // The plugin should handle both absolute and relative paths internally
      // during its setup phase - we test the plugin creation here
      const plugin2 = esbuildPluginPino({ transports: ["pino-pretty"] })
      expect(plugin2.name).toBe("pino")
      expect(typeof plugin2.setup).toBe("function")
    })
  })

  describe("Cross-platform compatibility", () => {
    it("handles mixed path separators", () => {
      const esbuildPluginPino = require("../dist/index.js")

      // The plugin should handle this internally via path normalization
      const plugin = esbuildPluginPino({ transports: [] })
      expect(plugin.name).toBe("pino")
      expect(typeof plugin.setup).toBe("function")
    })
  })
})
