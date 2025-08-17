#!/usr/bin/env node

const fs = require("node:fs")
const path = require("node:path")

const distDir = path.join(__dirname, "dist")

// Fix CommonJS export for ESM interop and named exports
const cjsFile = path.join(distDir, "index.js")
let cjsContent = fs.readFileSync(cjsFile, "utf8")
if (
  cjsContent.includes("module.exports = esbuildPluginPino;") &&
  !cjsContent.includes("module.exports.default = esbuildPluginPino;")
) {
  cjsContent = cjsContent.replace(
    "module.exports = esbuildPluginPino;",
    `module.exports = esbuildPluginPino;
module.exports.default = esbuildPluginPino;
module.exports.esbuildPluginPino = esbuildPluginPino;`,
  )
  fs.writeFileSync(cjsFile, cjsContent)
  console.log("Fixed CommonJS exports with named export support")
}

// Fix ESM export to include both default and named exports
const esmFile = path.join(distDir, "index.mjs")
let esmContent = fs.readFileSync(esmFile, "utf8")
if (esmContent.includes("export { esbuildPluginPino as default };")) {
  esmContent = esmContent.replace(
    "export { esbuildPluginPino as default };",
    `export default esbuildPluginPino;
export { esbuildPluginPino };`,
  )
  fs.writeFileSync(esmFile, esmContent)
  console.log("Fixed ESM exports with named export support")
} else if (
  esmContent.includes("export default esbuildPluginPino;") &&
  !esmContent.includes("export { esbuildPluginPino };")
) {
  esmContent = esmContent.replace(
    "export default esbuildPluginPino;",
    `export default esbuildPluginPino;
export { esbuildPluginPino };`,
  )
  fs.writeFileSync(esmFile, esmContent)
  console.log("Added named export to ESM")
}

// Fix TypeScript declarations to use export default with named exports
const dtsFile = path.join(distDir, "index.d.ts")
let dtsContent = fs.readFileSync(dtsFile, "utf8")

// Only apply fix if we haven't already applied it
if (
  !dtsContent.includes("export default esbuildPluginPino;") ||
  !dtsContent.includes("export { esbuildPluginPino };")
) {
  // Replace old export patterns with clean export default + named export
  if (dtsContent.includes("export { esbuildPluginPino as default };")) {
    dtsContent = dtsContent.replace(
      "export { esbuildPluginPino as default };",
      `export default esbuildPluginPino;
export { esbuildPluginPino };`,
    )
    fs.writeFileSync(dtsFile, dtsContent)
    console.log(
      "Fixed TypeScript declarations with export default and named exports",
    )
  } else if (dtsContent.includes("export = esbuildPluginPino;")) {
    // Replace export = pattern with export default
    dtsContent = dtsContent.replace(
      /declare namespace esbuildPluginPino \{[^}]*\}\s*export = esbuildPluginPino;/,
      "export default esbuildPluginPino;",
    )
    if (!dtsContent.includes("export { esbuildPluginPino };")) {
      dtsContent = dtsContent.replace(
        "export default esbuildPluginPino;",
        `export default esbuildPluginPino;
export { esbuildPluginPino };`,
      )
    }
    fs.writeFileSync(dtsFile, dtsContent)
    console.log(
      "Fixed TypeScript declarations with export default and named exports",
    )
  }
}

console.log("Export fixes applied successfully")
