#!/usr/bin/node
const { build } = require("esbuild")
const esbuildPluginPino = require("../../dist")
const { resolve } = require("node:path")

// Use explicit absWorkingDir different from process.cwd()
const explicitWorkingDir = resolve(__dirname, "..", "..")
const relativeOutdir = "test/dist-absworkingdir"

build({
  entryPoints: {
    first: "./test/fixtures/first.js",
    "nested/second": "./test/fixtures/second.js",
  },
  logLevel: "info",
  outdir: relativeOutdir,
  absWorkingDir: explicitWorkingDir, // Explicit working directory
  bundle: true,
  platform: "node",
  format: "cjs",
  plugins: [esbuildPluginPino({ transports: ["pino-pretty"] })],
}).catch((err) => {
  console.error(err)
  process.exit(1)
})

// Export for test usage
module.exports = {
  explicitWorkingDir,
  relativeOutdir,
  finalOutdir: resolve(explicitWorkingDir, relativeOutdir),
}
