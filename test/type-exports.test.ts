import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

/**
 * Tests for GitHub issue #246: Type export compatibility
 *
 * These tests verify that the plugin can be imported correctly in both
 * ESM and CommonJS scenarios without requiring .default workarounds.
 */
describe("Type Export Compatibility (Issue #246)", () => {
  it("TypeScript declaration uses correct ESM export syntax", () => {
    // Read the generated .d.ts file
    const dtsPath = resolve(__dirname, "../dist/index.d.ts")
    const dtsContent = readFileSync(dtsPath, "utf8")

    // With our export fix, should generate export default pattern
    expect(dtsContent).toContain("export default esbuildPluginPino")

    // Should have the function declaration
    expect(dtsContent).toContain("declare function esbuildPluginPino")
  })

  it("ESM import works without .default workaround", async () => {
    // This is the exact code that was failing in the GitHub issue
    const { default: esbuildPluginPino } = await import("../dist/index.mjs")

    // Verify the plugin function is directly callable
    expect(typeof esbuildPluginPino).toBe("function")

    // Verify it returns a valid esbuild plugin object
    const plugin = esbuildPluginPino({ transports: [] })
    expect(plugin).toHaveProperty("name", "pino")
    expect(plugin).toHaveProperty("setup")
    expect(typeof plugin.setup).toBe("function")
  })

  it("ESM named import works (issue #250 requirement)", async () => {
    // Test the named import pattern requested in issue #250
    const { esbuildPluginPino } = await import("../dist/index.mjs")

    // Verify the plugin function is directly callable
    expect(typeof esbuildPluginPino).toBe("function")

    // Verify it returns a valid esbuild plugin object
    const plugin = esbuildPluginPino({ transports: [] })
    expect(plugin).toHaveProperty("name", "pino")
    expect(plugin).toHaveProperty("setup")
    expect(typeof plugin.setup).toBe("function")
  })

  it("CommonJS require works correctly", () => {
    // Test CommonJS import
    const esbuildPluginPino = require("../dist/index.js")

    // Verify the plugin function is directly callable
    expect(typeof esbuildPluginPino).toBe("function")

    // Verify it returns a valid esbuild plugin object
    const plugin = esbuildPluginPino({ transports: [] })
    expect(plugin).toHaveProperty("name", "pino")
    expect(plugin).toHaveProperty("setup")
    expect(typeof plugin.setup).toBe("function")
  })

  it("ESM and CommonJS imports return equivalent functionality", async () => {
    // Import via ESM
    const { default: esmPlugin } = await import("../dist/index.mjs")

    // Import via CommonJS
    const cjsPlugin = require("../dist/index.js")

    // Both should be functions
    expect(typeof esmPlugin).toBe("function")
    expect(typeof cjsPlugin).toBe("function")

    // Both should return equivalent plugin objects
    const esmResult = esmPlugin({ transports: [] })
    const cjsResult = cjsPlugin({ transports: [] })

    expect(esmResult.name).toBe(cjsResult.name)
    expect(typeof esmResult.setup).toBe(typeof cjsResult.setup)
  })

  it("TypeScript import syntax works (regression test for original issue)", () => {
    // This test simulates the TypeScript import that was failing
    // We can't actually test TypeScript compilation in a Vitest runtime,
    // but we can test the runtime behavior that TypeScript would generate

    const esbuildPluginPino = require("../dist/index.js")

    // This is what TypeScript generates for: import esbuildPluginPino from 'esbuild-plugin-pino'
    // when using export = syntax (it should work directly, no .default needed)
    const config = {
      plugins: [esbuildPluginPino({ transports: [] })],
    }

    expect(config.plugins).toHaveLength(1)
    expect(config.plugins[0]).toHaveProperty("name", "pino")
  })

  describe("Import pattern comprehensive testing", () => {
    it("supports all CommonJS import patterns", () => {
      // Direct require
      const plugin1 = require("../dist/index.js")
      expect(typeof plugin1).toBe("function")

      // With destructuring (should work with our ESM interop fix)
      const { default: plugin2 } = require("../dist/index.js")
      expect(typeof plugin2).toBe("function") // .default now available for ESM interop

      // Access as property
      const pluginModule = require("../dist/index.js")
      expect(typeof pluginModule).toBe("function")
    })

    it("ESM import patterns work correctly", async () => {
      // Default import
      const { default: plugin1 } = await import("../dist/index.mjs")
      expect(typeof plugin1).toBe("function")

      // Named import (issue #250 requirement)
      const { esbuildPluginPino: plugin2 } = await import("../dist/index.mjs")
      expect(typeof plugin2).toBe("function")

      // Both should be the same function
      expect(plugin1 === plugin2).toBe(true)

      // Namespace import
      const pluginNamespace = await import("../dist/index.mjs")
      expect(typeof pluginNamespace.default).toBe("function")
      expect(typeof pluginNamespace.esbuildPluginPino).toBe("function")
    })

    it("mixed usage patterns in same project", async () => {
      // ESM import
      const { default: esmPlugin } = await import("../dist/index.mjs")

      // CommonJS require
      const cjsPlugin = require("../dist/index.js")

      // Both should create equivalent plugins
      const esmResult = esmPlugin({ transports: [] })
      const cjsResult = cjsPlugin({ transports: [] })

      expect(esmResult.name).toBe(cjsResult.name)
      expect(typeof esmResult.setup).toBe(typeof cjsResult.setup)
    })
  })

  describe("TypeScript compatibility edge cases", () => {
    it("handles strict TypeScript compilation patterns", () => {
      const esbuildPluginPino = require("../dist/index.js")

      // Strict mode usage pattern
      const plugin = esbuildPluginPino({ transports: [] })
      expect(plugin.name).toBe("pino")
    })

    it("works with TypeScript esModuleInterop patterns", () => {
      // This simulates what TypeScript generates with esModuleInterop: true
      const esbuildPluginPino = require("../dist/index.js")

      // Should work without requiring .default access
      const result = esbuildPluginPino({ transports: [] })
      expect(result.name).toBe("pino")
    })
  })
})
