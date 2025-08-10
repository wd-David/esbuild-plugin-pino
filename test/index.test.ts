import { execSync } from "node:child_process"
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { execa } from "execa"
import { afterEach, describe, expect, it } from "vitest"

const buildJsScriptPath = resolve(__dirname, "buildScripts/buildJS.js")
const buildTsScriptPath = resolve(__dirname, "buildScripts/buildTS.ts")
const arrayOfObjectsScriptPath = resolve(
  __dirname,
  "buildScripts/arrayOfObjects.ts",
)
const buildAbsolutePathScriptPath = resolve(
  __dirname,
  "buildScripts/buildAbsolutePath.js",
)
const buildAbsWorkingDirScriptPath = resolve(
  __dirname,
  "buildScripts/buildAbsWorkingDir.js",
)
const buildOutExtensionScriptPath = resolve(
  __dirname,
  "buildScripts/buildOutExtension.js",
)
const distFolder = "test/dist"

const functionDeclaration = "function pinoBundlerAbsolutePath(p)"

describe("Test esbuildPluginPino", () => {
  afterEach(() => {
    // Remove dist folder
    rmSync(distFolder, { recursive: true, force: true })
  })
  it("Two entrypoints with nested file", async () => {
    expect.assertions(12)

    // Execute build script
    // node test/buildScripts/buildJS.js
    execSync(`node ${resolve(buildJsScriptPath)}`)

    // Find all files in the folder
    const rootFiles = readdirSync(distFolder).filter((e) => e.endsWith(".js"))
    const nestedFiles = readdirSync(resolve(distFolder, "abc/cde")).filter(
      (e) => e.endsWith(".js"),
    )

    const firstFile = rootFiles.find((e) => e.startsWith("first"))
    const secondFile = nestedFiles.find((e) => e.startsWith("second"))
    const threadStream = rootFiles.find((e) => e.startsWith("thread-stream"))
    const pinoWorker = rootFiles.find((e) => e.startsWith("pino-worker"))
    const pinoFile = rootFiles.find((e) => e.startsWith("pino-file"))
    const pinoPretty = rootFiles.find((e) => e.startsWith("pino-pretty"))

    // Check that all required files have been generated
    expect(firstFile).toBeTruthy()
    expect(secondFile).toBeTruthy()
    expect(threadStream).toBeTruthy()
    expect(pinoWorker).toBeTruthy()
    expect(pinoFile).toBeTruthy()
    expect(pinoPretty).toBeTruthy()

    // Check that the root file has the right path to pino-file
    const firstContent = readFileSync(
      resolve(distFolder, firstFile as string),
      "utf-8",
    )
    const overrides = `globalThis.__bundlerPathsOverrides = { ...globalThis.__bundlerPathsOverrides || {}, "thread-stream-worker": pinoBundlerAbsolutePath("./thread-stream-worker.js"), "pino-worker": pinoBundlerAbsolutePath("./pino-worker.js"), "pino/file": pinoBundlerAbsolutePath("./pino-file.js"), "pino-pretty": pinoBundlerAbsolutePath("./pino-pretty.js") };`
    expect(firstContent.includes(functionDeclaration)).toBeTruthy()
    expect(firstContent.includes(overrides)).toBeTruthy()

    // Check the log output
    const { stdout } = await execa(process.argv[0], [
      resolve(distFolder, firstFile as string),
    ])
    expect(stdout).toEqual(expect.stringMatching(/This is first/))

    // Check that the root file has the right path to pino-file
    const secondDistFilePath = resolve(distFolder, `abc/cde/${secondFile}`)
    const secondContent = readFileSync(secondDistFilePath, "utf-8")
    expect(secondContent.includes(functionDeclaration)).toBeTruthy()
    expect(secondContent.includes(overrides)).toBeTruthy()

    // Check the log output
    const { stdout: stdout2 } = await execa(process.argv[0], [
      resolve(secondDistFilePath),
    ])
    expect(stdout2).toEqual(expect.stringMatching(/This is second/))
  })
  it(
    "Two entrypoints with nested file in array of objects",
    {
      timeout: 30000,
    },
    async () => {
      expect.assertions(12)

      // Execute build script
      // npx tsx test/buildScripts/arrayOfObjects.js
      execSync(`npx tsx ${resolve(arrayOfObjectsScriptPath)}`)

      // Find all files in the folder
      const rootFiles = readdirSync(distFolder).filter((e) => e.endsWith(".js"))
      const nestedFiles = readdirSync(resolve(distFolder, "abc/cde")).filter(
        (e) => e.endsWith(".js"),
      )

      const firstFile = rootFiles.find((e) => e.startsWith("first"))
      const secondFile = nestedFiles.find((e) => e.startsWith("second"))
      const threadStream = rootFiles.find((e) => e.startsWith("thread-stream"))
      const pinoWorker = rootFiles.find((e) => e.startsWith("pino-worker"))
      const pinoFile = rootFiles.find((e) => e.startsWith("pino-file"))
      const pinoPretty = rootFiles.find((e) => e.startsWith("pino-pretty"))

      // Check that all required files have been generated
      expect(firstFile).toBeTruthy()
      expect(secondFile).toBeTruthy()
      expect(threadStream).toBeTruthy()
      expect(pinoWorker).toBeTruthy()
      expect(pinoFile).toBeTruthy()
      expect(pinoPretty).toBeTruthy()

      // Check that the root file has the right path to pino-file
      const firstContent = readFileSync(
        resolve(distFolder, firstFile as string),
        "utf-8",
      )
      const overrides = `globalThis.__bundlerPathsOverrides = { ...globalThis.__bundlerPathsOverrides || {}, "thread-stream-worker": pinoBundlerAbsolutePath("./thread-stream-worker.js"), "pino-worker": pinoBundlerAbsolutePath("./pino-worker.js"), "pino/file": pinoBundlerAbsolutePath("./pino-file.js"), "pino-pretty": pinoBundlerAbsolutePath("./pino-pretty.js") };`
      expect(firstContent.includes(functionDeclaration)).toBeTruthy()
      expect(firstContent.includes(overrides)).toBeTruthy()

      // Check the log output
      const { stdout } = await execa(process.argv[0], [
        resolve(distFolder, firstFile as string),
      ])
      expect(stdout).toEqual(expect.stringMatching(/This is first/))

      // Check that the root file has the right path to pino-file
      const secondDistFilePath = resolve(distFolder, `abc/cde/${secondFile}`)
      const secondContent = readFileSync(secondDistFilePath, "utf-8")
      expect(secondContent.includes(functionDeclaration)).toBeTruthy()
      expect(secondContent.includes(overrides)).toBeTruthy()

      // Check the log output
      const { stdout: stdout2 } = await execa(process.argv[0], [
        resolve(secondDistFilePath),
      ])
      expect(stdout2).toEqual(expect.stringMatching(/This is second/))
    },
  )
  it("Multiple pino transports with TypeScript", async () => {
    expect.assertions(9)

    // Execute build script
    // npx tsx test/buildScripts/buildTS.ts
    execSync(`npx tsx ${resolve(buildTsScriptPath)}`)

    // Find all files in the folder
    const rootFiles = readdirSync(distFolder).filter((e) => e.endsWith(".js"))
    const thirdFile = rootFiles.find((e) => e.startsWith("third"))
    const threadStream = rootFiles.find((e) => e.startsWith("thread-stream"))
    const pinoWorker = rootFiles.find((e) => e.startsWith("pino-worker"))
    const pinoFile = rootFiles.find((e) => e.startsWith("pino-file"))
    const pinoPretty = rootFiles.find((e) => e.startsWith("pino-pretty"))
    const pinoLoki = rootFiles.find((e) => e.startsWith("pino-loki"))

    // Check that all required files have been generated
    expect(thirdFile).toBeTruthy()
    expect(threadStream).toBeTruthy()
    expect(pinoWorker).toBeTruthy()
    expect(pinoFile).toBeTruthy()
    expect(pinoPretty).toBeTruthy()
    expect(pinoLoki).toBeTruthy()

    // Check that the root file has the right path to pino-file
    const thirdContent = readFileSync(
      resolve(distFolder, thirdFile as string),
      "utf-8",
    )
    const overrides = `globalThis.__bundlerPathsOverrides = { ...globalThis.__bundlerPathsOverrides || {}, "thread-stream-worker": pinoBundlerAbsolutePath("./thread-stream-worker.js"), "pino-worker": pinoBundlerAbsolutePath("./pino-worker.js"), "pino/file": pinoBundlerAbsolutePath("./pino-file.js"), "pino-loki": pinoBundlerAbsolutePath("./pino-loki.js"), "pino-pretty": pinoBundlerAbsolutePath("./pino-pretty.js") };`
    expect(thirdContent.includes(functionDeclaration)).toBeTruthy()
    expect(thirdContent.includes(overrides)).toBeTruthy()

    // Check the log output
    const { stdout } = await execa(process.argv[0], [
      resolve(distFolder, thirdFile as string),
    ])
    expect(stdout).toEqual(expect.stringMatching(/This is third/))
  })

  it("Works with different working directory (process.cwd independence)", async () => {
    expect.assertions(4)

    // Build from current directory
    execSync(`node ${resolve(buildJsScriptPath)}`)

    // Find the generated files
    const rootFiles = readdirSync(distFolder).filter((e) => e.endsWith(".js"))
    const nestedFiles = readdirSync(resolve(distFolder, "abc/cde")).filter(
      (e) => e.endsWith(".js"),
    )

    const firstFile = rootFiles.find((e) => e.startsWith("first"))
    const secondFile = nestedFiles.find((e) => e.startsWith("second"))

    // Create a temporary directory and change to it
    const tempDir = mkdtempSync(join(tmpdir(), "esbuild-plugin-pino-test-"))
    const originalCwd = process.cwd()

    try {
      // Change to the temporary directory
      process.chdir(tempDir)

      // Execute bundles from the different working directory
      // This would fail with the old process.cwd() approach
      const { stdout: stdout1 } = await execa(process.argv[0], [
        resolve(originalCwd, distFolder, firstFile as string),
      ])
      expect(stdout1).toEqual(expect.stringMatching(/This is first/))

      const { stdout: stdout2 } = await execa(process.argv[0], [
        resolve(originalCwd, distFolder, `abc/cde/${secondFile}`),
      ])
      expect(stdout2).toEqual(expect.stringMatching(/This is second/))

      // Verify we're actually running from a different directory
      // Use realpath to handle macOS /var vs /private/var symlink resolution
      const currentDir = readdirSync(process.cwd(), { withFileTypes: true })[0]
        ? process.cwd()
        : null
      const expectedDir = readdirSync(tempDir, { withFileTypes: true })[0]
        ? tempDir
        : null
      expect(currentDir).not.toBe(originalCwd)
      expect(currentDir !== originalCwd).toBe(true)
    } finally {
      // Restore original working directory
      process.chdir(originalCwd)
      rmSync(tempDir, { recursive: true, force: true })
    }
  })

  it("Works with absolute output path", async () => {
    expect.assertions(6)

    // Execute the build script that uses absolute output path
    const { execSync } = require("node:child_process")
    execSync(`node ${buildAbsolutePathScriptPath}`, {
      encoding: "utf8",
      stdio: "pipe",
    })

    // Read the temp directory details from the generated file
    const tempInfoPath = resolve(__dirname, "buildScripts", "temp-info.json")
    const { tempDir, absoluteOutdir } = JSON.parse(
      readFileSync(tempInfoPath, "utf8"),
    )

    try {
      // Find all files in the absolute output directory
      const rootFiles = readdirSync(absoluteOutdir).filter((e) =>
        e.endsWith(".js"),
      )
      const nestedFiles = readdirSync(resolve(absoluteOutdir, "nested")).filter(
        (e) => e.endsWith(".js"),
      )

      const firstFile = rootFiles.find((e) => e.startsWith("first"))
      const secondFile = nestedFiles.find((e) => e.startsWith("second"))
      const threadStream = rootFiles.find((e) => e.startsWith("thread-stream"))
      const pinoWorker = rootFiles.find((e) => e.startsWith("pino-worker"))

      // Check that all required files have been generated
      expect(firstFile).toBeTruthy()
      expect(secondFile).toBeTruthy()
      expect(threadStream).toBeTruthy()
      expect(pinoWorker).toBeTruthy()

      // Execute bundles to verify they work with absolute paths
      const { stdout: stdout1 } = await execa(process.argv[0], [
        resolve(absoluteOutdir, firstFile as string),
      ])
      expect(stdout1).toEqual(expect.stringMatching(/This is first/))

      const { stdout: stdout2 } = await execa(process.argv[0], [
        resolve(absoluteOutdir, `nested/${secondFile}`),
      ])
      expect(stdout2).toEqual(expect.stringMatching(/This is second/))
    } finally {
      // Clean up the temporary directory and temp info file
      rmSync(tempDir, { recursive: true, force: true })
      const tempInfoPath = resolve(__dirname, "buildScripts", "temp-info.json")
      rmSync(tempInfoPath, { force: true })
    }
  })

  it("Works with explicit absWorkingDir", async () => {
    expect.assertions(6)

    // Execute the build script that uses explicit absWorkingDir
    const { execSync } = require("node:child_process")
    execSync(`node ${buildAbsWorkingDirScriptPath}`, {
      encoding: "utf8",
      stdio: "pipe",
    })

    // Import the build script to get the output directory details
    delete require.cache[require.resolve(buildAbsWorkingDirScriptPath)]
    const { explicitWorkingDir, relativeOutdir, finalOutdir } = require(
      buildAbsWorkingDirScriptPath,
    )

    try {
      // Find all files in the output directory
      const rootFiles = readdirSync(finalOutdir).filter((e) =>
        e.endsWith(".js"),
      )
      const nestedFiles = readdirSync(resolve(finalOutdir, "nested")).filter(
        (e) => e.endsWith(".js"),
      )

      const firstFile = rootFiles.find((e) => e.startsWith("first"))
      const secondFile = nestedFiles.find((e) => e.startsWith("second"))
      const threadStream = rootFiles.find((e) => e.startsWith("thread-stream"))
      const pinoWorker = rootFiles.find((e) => e.startsWith("pino-worker"))

      // Check that all required files have been generated
      expect(firstFile).toBeTruthy()
      expect(secondFile).toBeTruthy()
      expect(threadStream).toBeTruthy()
      expect(pinoWorker).toBeTruthy()

      // Execute bundles to verify they work with explicit absWorkingDir
      const { stdout: stdout1 } = await execa(process.argv[0], [
        resolve(finalOutdir, firstFile as string),
      ])
      expect(stdout1).toEqual(expect.stringMatching(/This is first/))

      const { stdout: stdout2 } = await execa(process.argv[0], [
        resolve(finalOutdir, `nested/${secondFile}`),
      ])
      expect(stdout2).toEqual(expect.stringMatching(/This is second/))
    } finally {
      // Clean up the output directory
      rmSync(finalOutdir, { recursive: true, force: true })
    }
  })

  it("Respects outExtension configuration", async () => {
    expect.assertions(12)

    // Execute build script
    execSync(`node ${resolve(buildOutExtensionScriptPath)}`)

    // Find all files in the folder - should have .cjs extension now
    const rootFiles = readdirSync(distFolder).filter((e) => e.endsWith(".cjs"))
    const nestedFiles = readdirSync(resolve(distFolder, "abc/cde")).filter(
      (e) => e.endsWith(".cjs"),
    )

    const firstFile = rootFiles.find((e) => e.startsWith("first"))
    const secondFile = nestedFiles.find((e) => e.startsWith("second"))
    const threadStream = rootFiles.find((e) => e.startsWith("thread-stream"))
    const pinoWorker = rootFiles.find((e) => e.startsWith("pino-worker"))
    const pinoFile = rootFiles.find((e) => e.startsWith("pino-file"))
    const pinoPretty = rootFiles.find((e) => e.startsWith("pino-pretty"))

    // Check that all required files have been generated with .cjs extension
    expect(firstFile).toBeTruthy()
    expect(secondFile).toBeTruthy()
    expect(threadStream).toBeTruthy()
    expect(pinoWorker).toBeTruthy()
    expect(pinoFile).toBeTruthy()
    expect(pinoPretty).toBeTruthy()

    // Check that the root file has the right path to pino-file with .cjs extension
    const firstContent = readFileSync(
      resolve(distFolder, firstFile as string),
      "utf-8",
    )
    // The key difference: overrides should now reference .cjs files, not .js files
    const overrides = `globalThis.__bundlerPathsOverrides = { ...globalThis.__bundlerPathsOverrides || {}, "thread-stream-worker": pinoBundlerAbsolutePath("./thread-stream-worker.cjs"), "pino-worker": pinoBundlerAbsolutePath("./pino-worker.cjs"), "pino/file": pinoBundlerAbsolutePath("./pino-file.cjs"), "pino-pretty": pinoBundlerAbsolutePath("./pino-pretty.cjs") };`
    expect(firstContent.includes(functionDeclaration)).toBeTruthy()
    expect(firstContent.includes(overrides)).toBeTruthy()

    // Check the log output
    const { stdout } = await execa(process.argv[0], [
      resolve(distFolder, firstFile as string),
    ])
    expect(stdout).toEqual(expect.stringMatching(/This is first/))

    // Check that the nested file has the right path to pino-file with .cjs extension
    const secondDistFilePath = resolve(distFolder, `abc/cde/${secondFile}`)
    const secondContent = readFileSync(secondDistFilePath, "utf-8")
    expect(secondContent.includes(functionDeclaration)).toBeTruthy()
    expect(secondContent.includes(overrides)).toBeTruthy()

    // Check the log output
    const { stdout: stdout2 } = await execa(process.argv[0], [
      resolve(secondDistFilePath),
    ])
    expect(stdout2).toEqual(expect.stringMatching(/This is second/))
  })
})
