import { execSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

/**
 * Tests for the build process and post-build type fixing
 * 
 * These tests verify that our build pipeline correctly fixes
 * the TypeScript declaration exports automatically.
 */
describe("Build Process Type Export Fix", () => {
  it("post-build script correctly fixes TypeScript declarations", () => {
    // Run just pkgroll to get the initial (broken) output
    execSync("npx pkgroll", { cwd: resolve(__dirname, "..") })
    
    // Read the declaration file before fix
    const dtsPath = resolve(__dirname, "../dist/index.d.ts")
    let dtsContent = readFileSync(dtsPath, "utf8")
    
    // It should initially have the problematic export format
    expect(dtsContent).toContain("export { esbuildPluginPino as default }")
    expect(dtsContent).not.toContain("export = esbuildPluginPino")
    
    // Run the fix script
    execSync("node fix-types.js", { cwd: resolve(__dirname, "..") })
    
    // Read the declaration file after fix
    dtsContent = readFileSync(dtsPath, "utf8")
    
    // Now it should have the correct export format
    expect(dtsContent).toContain("export = esbuildPluginPino")
    expect(dtsContent).not.toContain("export { esbuildPluginPino as default }")
  })

  it("full build command includes the type fix automatically", () => {
    // Run the full build command (which includes the fix)
    execSync("npm run build", { cwd: resolve(__dirname, "..") })
    
    // Verify the final result has the correct exports
    const dtsPath = resolve(__dirname, "../dist/index.d.ts")
    const dtsContent = readFileSync(dtsPath, "utf8")
    
    expect(dtsContent).toContain("export = esbuildPluginPino")
    expect(dtsContent).not.toContain("export { esbuildPluginPino as default }")
  })

  it("JavaScript outputs use correct module.exports syntax", () => {
    // The CommonJS output should use module.exports
    const cjsPath = resolve(__dirname, "../dist/index.js")
    const cjsContent = readFileSync(cjsPath, "utf8")
    
    expect(cjsContent).toContain("module.exports = esbuildPluginPino")
    
    // The ESM output should also use module.exports for compatibility
    const esmPath = resolve(__dirname, "../dist/index.mjs")
    const esmContent = readFileSync(esmPath, "utf8")
    
    expect(esmContent).toContain("module.exports = esbuildPluginPino")
  })
})