import { readFile, stat } from "node:fs/promises"
import path from "node:path"
import type { BuildOptions, Plugin } from "esbuild"

type NewEntrypointsType = Extract<
  BuildOptions["entryPoints"],
  { in: string; out: string }[]
>

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
  transports = [],
}: {
  transports: string[]
}): Plugin {
  return {
    name: "pino",
    async setup(currentBuild) {
      const pino = path.dirname(require.resolve("pino"))
      const threadStream = path.dirname(require.resolve("thread-stream"))

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
      } catch (err) {
        // Ignored
      }

      /** Transports */
      const transportsEntrypoints: Record<string, string> = Object.fromEntries(
        transports.map((transport) => [transport, require.resolve(transport)]),
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

      currentBuild.onResolve(
        { filter: /^virtual:esbuild-plugin-pino-abspath$/ },
        (args) => {
          return {
            path: args.path,
            namespace: 'esbuild-plugin-pino'
          }
        }
      )

      currentBuild.onLoad({filter: /^virtual:esbuild-plugin-pino-abspath$/, namespace: 'esbuild-plugin-pino'}, () => {
        if (currentBuild.initialOptions.format === 'esm') {
          return {
            contents: `\
              import { fileURLToPath } from 'node:url';

              export function pinoBundlerAbsolutePath(p) {
                return fileURLToPath(new URL(p, import.meta.url));
              }
            `
          }
        }

        return {
          contents: `\
            exports.pinoBundlerAbsolutePath = function(p) {
              return require('path').join(__dirname, p);
            }
          `
        }
      })

      currentBuild.onLoad({ filter: /pino\.js$/ }, async (args) => {
        const contents = await readFile(args.path, "utf8")

        const functionDeclaration = `\
          const { pinoBundlerAbsolutePath } = require('virtual:esbuild-plugin-pino-abspath');
        `

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
