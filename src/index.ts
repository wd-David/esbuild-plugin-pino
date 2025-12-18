import { readFile, stat } from "node:fs/promises"
import path from "node:path"
import { createRequire } from "node:module"
import type { BuildOptions, Plugin } from "esbuild"

// Create a require function that works in both CJS and ESM
const requireFunc = typeof require !== "undefined" 
  ? require 
  : createRequire(import.meta.url)

const hybridResolve = requireFunc.resolve.bind(requireFunc)

type NewEntrypointsType = { in: string; out: string }[]

/**
 * Check if entrypoints is an array of strings
 * @param entryPoints
 * @returns
 */
function isStringArray(
  entryPoints: BuildOptions["entryPoints"],
): entryPoints is string[] {
  if (
    Array.isArray(entryPoints) &&
    entryPoints.some((entrypoint) => typeof entrypoint === "string")
  )
    return true
  return false
}

/**
 * Transform from string[] to Record<string, string>
 * @param entryPoints
 * @param outbase
 * @returns
 */
function transformToObject(
  entryPoints: string[],
  outbase: string | undefined,
): Record<string, string> {
  const separator = entryPoints[0].includes("\\")
    ? path.win32.sep
    : path.posix.sep

  let tmpOutbase = ""
  if (!outbase) {
    const hierarchy = entryPoints[0].split(separator)
    let i = 0
    let nextOutbase = ""
    do {
      tmpOutbase = nextOutbase
      i++
      nextOutbase = hierarchy.slice(0, i).join(separator)
    } while (
      entryPoints.every((entrypoint: string) =>
        entrypoint.startsWith(`${nextOutbase}${separator}`),
      )
    )
  }
  const newEntrypoints: Record<string, string> = {}
  for (const entrypoint of entryPoints) {
    const destination = (
      tmpOutbase
        ? entrypoint.replace(`${tmpOutbase}${separator}`, "")
        : entrypoint
    ).replace(/.(js|ts)$/, "")
    newEntrypoints[destination] = entrypoint
  }
  return newEntrypoints
}

/**
 * Transform from Record<string, string> to { in: string, out: string }[]
 * @param entryPoints
 * @returns
 */
function transformToNewEntryPointsType(
  entryPoints: Record<string, string>,
): NewEntrypointsType {
  const newEntrypointsType: NewEntrypointsType = []
  for (const [key, value] of Object.entries(entryPoints)) {
    newEntrypointsType.push({ in: value, out: key })
  }
  return newEntrypointsType
}

/**
 * A pino plugin for esbuild
 * @example
 * ```js
 *   // in your build script:
 *   const { build } = require('esbuild')
 *   const esbuildPluginPino = require('esbuild-plugin-pino')
 *
 *   build({
 *     entryPoints: ['src/index.ts'],
 *     outdir: 'dist',
 *     plugins: [esbuildPluginPino({ transports: ['pino-pretty'] })],
 *   }).catch(() => process.exit(1))
 * ```
 * @example
 * Multiple entryPoints & pino transports
 * ```js
 *   // in your build script:
 *   const { build } = require('esbuild')
 *   const esbuildPluginPino = require('esbuild-plugin-pino')
 *
 *   build({
 *     entryPoints: {
 *       first: './first.js',
         'abc/cde/second': './second.js'
 *     },
 *     outdir: 'dist',
 *     plugins: [esbuildPluginPino({ transports: ['pino-pretty', 'pino-loki'] })],
 *   }).catch(() => process.exit(1))
 * ```
 */
export default function esbuildPluginPino({
  transports = [] as string[],
}: {
  transports?: string[]
} = {}): Plugin {
  return {
    name: "pino",
    async setup(currentBuild) {
      const pino = path.dirname(hybridResolve("pino"))
      const threadStream = path.dirname(hybridResolve("thread-stream"))

      const { entryPoints, outbase, outExtension } = currentBuild.initialOptions
      /** Pino and worker */
      const customEntrypoints: Record<string, string> = {
        "thread-stream-worker": path.join(threadStream, "lib/worker.js"),
        "pino-worker": path.join(pino, "lib/worker.js"),
        "pino-file": path.join(pino, "file.js"),
      }

      /** worker-pipeline.js was removed in Pino v9.1 */
      try {
        const pinoPipelineWorker = path.join(pino, "lib/worker-pipeline.js")
        await stat(pinoPipelineWorker)
        customEntrypoints["pino-pipeline-worker"] = pinoPipelineWorker
      } catch (_err) {
        // Ignored
      }

      /** Transports */
      const transportsEntrypoints: Record<string, string> = Object.fromEntries(
        transports.map((transport) => [transport, hybridResolve(transport)]),
      )

      let newEntrypoints: NewEntrypointsType = []
      /** Array of string */
      if (isStringArray(entryPoints)) {
        newEntrypoints = transformToNewEntryPointsType({
          ...transformToObject(entryPoints, outbase),
          ...customEntrypoints,
          ...transportsEntrypoints,
        })
        /** Array of object */
      } else if (Array.isArray(entryPoints)) {
        newEntrypoints = [
          ...(entryPoints as unknown as NewEntrypointsType),
          ...transformToNewEntryPointsType({
            ...customEntrypoints,
            ...transportsEntrypoints,
          }),
        ]
        /** Object */
      } else {
        newEntrypoints = transformToNewEntryPointsType({
          ...(entryPoints as Record<string, string>),
          ...customEntrypoints,
          ...transportsEntrypoints,
        })
      }

      currentBuild.initialOptions.entryPoints = newEntrypoints

      let pinoBundlerRan = false

      currentBuild.onEnd(() => {
        pinoBundlerRan = false
      })

      currentBuild.onLoad({ filter: /pino\.js$/ }, async (args) => {
        if (pinoBundlerRan) return
        pinoBundlerRan = true

        const contents = await readFile(args.path, "utf8")

        const { outdir = "dist" } = currentBuild.initialOptions

        // Create a clean path resolution function that works in both CJS and ESM
        let functionDeclaration = ""

        if (path.isAbsolute(outdir)) {
          // For absolute paths, use the build-time resolved path
          functionDeclaration = `
          function pinoBundlerAbsolutePath(p) {
            const outputDir = "${outdir.replace(/\\/g, "\\\\")}"
            const normalizedPath = p.replace(/^\\.\\//, '');
            
            try {
              const path = require('path');
              return path.join(outputDir, normalizedPath);
            } catch(e) {
              // Simple join for ESM or when path module not available
              return outputDir + '/' + normalizedPath;
            }
          }
        `
        } else {
          // For relative paths, use runtime resolution
          const workingDirTemplate = currentBuild.initialOptions.absWorkingDir
            ? `"${currentBuild.initialOptions.absWorkingDir.replace(/\\/g, "\\\\")}"`
            : "process.cwd()"

          functionDeclaration = `
          function pinoBundlerAbsolutePath(p) {
            const normalizedPath = p.replace(/^\\.\\//, '');
            const workingDir = ${workingDirTemplate};
            
            try {
              const path = require('path');
              const outputDir = path.resolve(workingDir, "${outdir}");
              return path.resolve(outputDir, normalizedPath);
            } catch(e) {
              // Simple join for ESM or when path module not available
              return [workingDir, "${outdir}", normalizedPath]
                .filter(Boolean)
                .join('/')
                .replace(/\\/+/g, '/');
            }
          }
        `
        }

        let extension = ".js"
        if (outExtension?.[".js"]) {
          extension = outExtension[".js"]
        }
        const pinoOverrides = Object.keys({
          ...customEntrypoints,
          ...transportsEntrypoints,
        })
          .map(
            (id) =>
              `'${
                id === "pino-file" ? "pino/file" : id
              }': pinoBundlerAbsolutePath('./${id}${extension}')`,
          )
          .join(",")

        // No import.meta polyfill needed - handled differently

        const globalThisDeclaration = `
          globalThis.__bundlerPathsOverrides = { ...(globalThis.__bundlerPathsOverrides || {}), ${pinoOverrides}}
        `

        const code = functionDeclaration + globalThisDeclaration

        return {
          contents: code + contents,
        }
      })
    },
  }
}
