#!/usr/bin/node
const { build } = require("esbuild")
const esbuildPluginPino = require("../../dist")
const { mkdtempSync, writeFileSync } = require("node:fs")
const { join } = require("node:path")
const { tmpdir } = require("node:os")

// Create a temporary absolute path for output
const tempDir = mkdtempSync(join(tmpdir(), "esbuild-plugin-pino-abs-test-"))
const absoluteOutdir = join(tempDir, "dist")

// Write temp info to a file for the test to read
const tempInfoPath = join(__dirname, "temp-info.json")
writeFileSync(tempInfoPath, JSON.stringify({ tempDir, absoluteOutdir }))

build({
  entryPoints: {
    first: "./test/fixtures/first.js",
    "nested/second": "./test/fixtures/second.js",
  },
  logLevel: "info",
  outdir: absoluteOutdir, // Use absolute path
  bundle: true,
  platform: "node",
  format: "cjs",
  plugins: [esbuildPluginPino({ transports: ["pino-pretty"] })],
}).catch((err) => {
  console.error(err)
  process.exit(1)
})
