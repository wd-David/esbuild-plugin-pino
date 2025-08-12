import { execSync } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it, beforeAll } from "vitest"

/**
 * Tests for the build process and post-build type fixing
 * 
 * These tests verify that our build pipeline correctly fixes
 * the TypeScript declaration exports automatically.
 */
describe("Build Process Type Export Fix", () => {
  // Ensure we have a fresh build before running tests
  beforeAll(() => {
    const cwd = resolve(__dirname, "..")
    try {
      // Only run build if dist doesn't exist or is incomplete
      const dtsPath = resolve(cwd, "dist/index.d.ts")
      const jsPath = resolve(cwd, "dist/index.js")
      const mjsPath = resolve(cwd, "dist/index.mjs")
      
      if (!existsSync(dtsPath) || !existsSync(jsPath) || !existsSync(mjsPath)) {
        execSync("npm run build", { cwd, timeout: 60000 })
      }
    } catch (error) {
      console.warn("Build failed in beforeAll, tests will handle individual builds")
    }
  }, 70000)

  it("post-build script correctly fixes TypeScript declarations", () => {
    const cwd = resolve(__dirname, "..")
    
    // Run just pkgroll to get the initial (broken) output
    execSync("npx pkgroll", { 
      cwd,
      timeout: 60000 // Increased timeout for CI
    })
    
    // Read the declaration file before fix
    const dtsPath = resolve(cwd, "dist/index.d.ts")
    let dtsContent = readFileSync(dtsPath, "utf8")
    
    // It should initially have the problematic export format
    expect(dtsContent).toContain("export { esbuildPluginPino as default }")
    expect(dtsContent).not.toContain("export = esbuildPluginPino")
    
    // Run the fix script
    execSync("node fix-types.js", { 
      cwd,
      timeout: 15000
    })
    
    // Read the declaration file after fix
    dtsContent = readFileSync(dtsPath, "utf8")
    
    // Now it should have the correct export format
    expect(dtsContent).toContain("export = esbuildPluginPino")
    expect(dtsContent).not.toContain("export { esbuildPluginPino as default }")
  }, 80000) // Increased timeout for CI

  it("full build command includes the type fix automatically", () => {
    const cwd = resolve(__dirname, "..")
    
    // Run the full build command (which includes the fix)
    execSync("npm run build", { 
      cwd,
      timeout: 60000 // Increased timeout for CI
    })
    
    // Verify the final result has the correct exports
    const dtsPath = resolve(cwd, "dist/index.d.ts")
    const dtsContent = readFileSync(dtsPath, "utf8")
    
    expect(dtsContent).toContain("export = esbuildPluginPino")
    expect(dtsContent).not.toContain("export { esbuildPluginPino as default }")
  }, 70000) // Increased timeout for CI

  it("JavaScript outputs use correct module.exports syntax", () => {
    const cwd = resolve(__dirname, "..")
    
    // The CommonJS output should use module.exports
    const cjsPath = resolve(cwd, "dist/index.js")
    const cjsContent = readFileSync(cjsPath, "utf8")
    
    expect(cjsContent).toContain("module.exports = esbuildPluginPino")
    
    // The ESM output should also use module.exports for compatibility
    const esmPath = resolve(cwd, "dist/index.mjs")
    const esmContent = readFileSync(esmPath, "utf8")
    
    expect(esmContent).toContain("module.exports = esbuildPluginPino")
  })
})