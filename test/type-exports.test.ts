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
  it("TypeScript declaration uses export = syntax (not named export)", () => {
    // Read the generated .d.ts file
    const dtsPath = resolve(__dirname, "../dist/index.d.ts")
    const dtsContent = readFileSync(dtsPath, "utf8")
    
    // Verify it uses the correct export syntax
    expect(dtsContent).toContain("export = esbuildPluginPino")
    
    // Verify it does NOT use the problematic named export syntax
    expect(dtsContent).not.toContain("export { esbuildPluginPino as default }")
  })

  it("ESM import works without .default workaround", async () => {
    // This is the exact code that was failing in the GitHub issue
    const { default: esbuildPluginPino } = await import("../dist/index.js")
    
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
    const { default: esmPlugin } = await import("../dist/index.js")
    
    // Import via CommonJS  
    const cjsPlugin = require("../dist/index.js")
    
    // Both should be functions
    expect(typeof esmPlugin).toBe("function")
    expect(typeof cjsPlugin).toBe("function")
    
    // Both should return equivalent plugin objects
    const esmResult = esmPlugin({ transports: ["pino-pretty"] })
    const cjsResult = cjsPlugin({ transports: ["pino-pretty"] })
    
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
})