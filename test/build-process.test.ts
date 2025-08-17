import { execSync } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import { beforeAll, describe, expect, it } from "vitest"

/**
 * Tests for the build process
 *
 * These tests verify that pkgroll correctly generates
 * dual package exports from our ESM source.
 */
describe("Build Process", () => {
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
    } catch (_error) {
      console.warn(
        "Build failed in beforeAll, tests will handle individual builds",
      )
    }
  }, 70000)

  it("pkgroll generates correct TypeScript declarations", () => {
    const cwd = resolve(__dirname, "..")

    // Run the build command
    execSync("npm run build", {
      cwd,
      timeout: 60000, // Increased timeout for CI
    })

    // Verify the declaration file has the correct export format
    const dtsPath = resolve(cwd, "dist/index.d.ts")
    const dtsContent = readFileSync(dtsPath, "utf8")

    // With ESM source, pkgroll should generate the correct default export declaration
    expect(dtsContent).toContain("export { esbuildPluginPino as default }")
  }, 70000) // Increased timeout for CI

  it("JavaScript outputs use correct module.exports syntax", () => {
    const cwd = resolve(__dirname, "..")

    // The CommonJS output should use module.exports
    const cjsPath = resolve(cwd, "dist/index.js")
    const cjsContent = readFileSync(cjsPath, "utf8")

    expect(cjsContent).toContain("module.exports = esbuildPluginPino")

    // The ESM output should NOT use module.exports for compatibility
    const esmPath = resolve(cwd, "dist/index.mjs")
    const esmContent = readFileSync(esmPath, "utf8")

    expect(esmContent).toContain("export { esbuildPluginPino as default }")
  })
})
