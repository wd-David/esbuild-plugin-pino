import { execSync } from "node:child_process"
import { readFileSync, readdirSync, rmSync } from "node:fs"
import { resolve } from "node:path"
import { execa } from "execa"
import { afterEach, describe, expect, it } from "vitest"

const buildJsScriptPath = resolve(__dirname, "buildScripts/buildJS.js")
const buildTsScriptPath = resolve(__dirname, "buildScripts/buildTS.ts")
const arrayOfObjectsScriptPath = resolve(
  __dirname,
  "buildScripts/arrayOfObjects.ts",
)
const distFolder = "test/dist"

const functionDeclaration = "pinoBundlerAbsolutePath = function(p)"

describe("Test esbuildPluginPino", () => {
  afterEach(() => {
    // Remove dist folder
    rmSync(distFolder, { recursive: true, force: true })
  })
  it("Two entrypoints with nested file", async () => {
    expect.assertions(13)

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
    const pinoPipelineWorker = rootFiles.find((e) =>
      e.startsWith("pino-pipeline-worker"),
    )
    const pinoFile = rootFiles.find((e) => e.startsWith("pino-file"))
    const pinoPretty = rootFiles.find((e) => e.startsWith("pino-pretty"))

    // Check that all required files have been generated
    expect(firstFile).toBeTruthy()
    expect(secondFile).toBeTruthy()
    expect(threadStream).toBeTruthy()
    expect(pinoWorker).toBeTruthy()
    expect(pinoPipelineWorker).toBeTruthy()
    expect(pinoFile).toBeTruthy()
    expect(pinoPretty).toBeTruthy()

    // Check that the root file has the right path to pino-file
    const firstContent = readFileSync(
      resolve(distFolder, firstFile as string),
      "utf-8",
    )
    const overrides = `globalThis.__bundlerPathsOverrides = { ...globalThis.__bundlerPathsOverrides || {}, "thread-stream-worker": pinoBundlerAbsolutePath("./thread-stream-worker.js"), "pino-worker": pinoBundlerAbsolutePath("./pino-worker.js"), "pino/file": pinoBundlerAbsolutePath("./pino-file.js"), "pino-pipeline-worker": pinoBundlerAbsolutePath("./pino-pipeline-worker.js"), "pino-pretty": pinoBundlerAbsolutePath("./pino-pretty.js") };`
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
  it("Two entrypoints with nested file in array of objects", async () => {
    expect.assertions(13)

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
    const pinoPipelineWorker = rootFiles.find((e) =>
      e.startsWith("pino-pipeline-worker"),
    )
    const pinoFile = rootFiles.find((e) => e.startsWith("pino-file"))
    const pinoPretty = rootFiles.find((e) => e.startsWith("pino-pretty"))

    // Check that all required files have been generated
    expect(firstFile).toBeTruthy()
    expect(secondFile).toBeTruthy()
    expect(threadStream).toBeTruthy()
    expect(pinoWorker).toBeTruthy()
    expect(pinoPipelineWorker).toBeTruthy()
    expect(pinoFile).toBeTruthy()
    expect(pinoPretty).toBeTruthy()

    // Check that the root file has the right path to pino-file
    const firstContent = readFileSync(
      resolve(distFolder, firstFile as string),
      "utf-8",
    )
    const overrides = `globalThis.__bundlerPathsOverrides = { ...globalThis.__bundlerPathsOverrides || {}, "thread-stream-worker": pinoBundlerAbsolutePath("./thread-stream-worker.js"), "pino-worker": pinoBundlerAbsolutePath("./pino-worker.js"), "pino/file": pinoBundlerAbsolutePath("./pino-file.js"), "pino-pipeline-worker": pinoBundlerAbsolutePath("./pino-pipeline-worker.js"), "pino-pretty": pinoBundlerAbsolutePath("./pino-pretty.js") };`
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
  it("Multiple pino transports with TypeScript", async () => {
    expect.assertions(10)

    // Execute build script
    // npx tsx test/buildScripts/buildTS.ts
    execSync(`npx tsx ${resolve(buildTsScriptPath)}`)

    // Find all files in the folder
    const rootFiles = readdirSync(distFolder).filter((e) => e.endsWith(".js"))
    const thirdFile = rootFiles.find((e) => e.startsWith("third"))
    const threadStream = rootFiles.find((e) => e.startsWith("thread-stream"))
    const pinoWorker = rootFiles.find((e) => e.startsWith("pino-worker"))
    const pinoPipelineWorker = rootFiles.find((e) =>
      e.startsWith("pino-pipeline-worker"),
    )
    const pinoFile = rootFiles.find((e) => e.startsWith("pino-file"))
    const pinoPretty = rootFiles.find((e) => e.startsWith("pino-pretty"))
    const pinoLoki = rootFiles.find((e) => e.startsWith("pino-loki"))

    // Check that all required files have been generated
    expect(thirdFile).toBeTruthy()
    expect(threadStream).toBeTruthy()
    expect(pinoWorker).toBeTruthy()
    expect(pinoPipelineWorker).toBeTruthy()
    expect(pinoFile).toBeTruthy()
    expect(pinoPretty).toBeTruthy()
    expect(pinoLoki).toBeTruthy()

    // Check that the root file has the right path to pino-file
    const thirdContent = readFileSync(
      resolve(distFolder, thirdFile as string),
      "utf-8",
    )
    const overrides = `globalThis.__bundlerPathsOverrides = { ...globalThis.__bundlerPathsOverrides || {}, "thread-stream-worker": pinoBundlerAbsolutePath("./thread-stream-worker.js"), "pino-worker": pinoBundlerAbsolutePath("./pino-worker.js"), "pino/file": pinoBundlerAbsolutePath("./pino-file.js"), "pino-pipeline-worker": pinoBundlerAbsolutePath("./pino-pipeline-worker.js"), "pino-loki": pinoBundlerAbsolutePath("./pino-loki.js"), "pino-pretty": pinoBundlerAbsolutePath("./pino-pretty.js") };`
    expect(thirdContent.includes(functionDeclaration)).toBeTruthy()
    expect(thirdContent.includes(overrides)).toBeTruthy()

    // Check the log output
    const { stdout } = await execa(process.argv[0], [
      resolve(distFolder, thirdFile as string),
    ])
    expect(stdout).toEqual(expect.stringMatching(/This is third/))
  })
})
