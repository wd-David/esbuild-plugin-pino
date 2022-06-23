import { dirname, sep, join, resolve } from 'path'
import { readFile } from 'fs/promises'
import type { Plugin } from 'esbuild'

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
  transports
}: {
  transports: string[]
}): Plugin {
  return {
    name: 'pino',
    setup(currentBuild) {
      const pino = dirname(require.resolve('pino'))
      const threadStream = dirname(require.resolve('thread-stream'))

      let entrypoints = currentBuild.initialOptions.entryPoints
      if (Array.isArray(entrypoints)) {
        let outbase = currentBuild.initialOptions.outbase
        if (!outbase) {
          const hierarchy = entrypoints[0].split(sep)
          let i = 0
          outbase = ''
          let nextOutbase = ''
          do {
            outbase = nextOutbase
            i++
            nextOutbase = hierarchy.slice(0, i).join(sep)
          } while (
            entrypoints.every((e) => e.startsWith(`${nextOutbase}${sep}`))
          )
        }
        const newEntrypoints: Record<string, string> = {}
        for (const entrypoint of entrypoints) {
          const destination = (
            outbase ? entrypoint.replace(`${outbase}${sep}`, '') : entrypoint
          ).replace(/.(js|ts)$/, '')
          newEntrypoints[destination] = entrypoint
        }
        entrypoints = newEntrypoints
      }

      const customEntrypoints = {
        'thread-stream-worker': join(threadStream, 'lib/worker.js'),
        'pino-worker': join(pino, 'lib/worker.js'),
        'pino-pipeline-worker': join(pino, 'lib/worker-pipeline.js'),
        'pino-file': join(pino, 'file.js')
      }
      const transportsEntrypoints = Object.fromEntries(
        (transports || []).map((t) => [t, require.resolve(t)])
      )
      currentBuild.initialOptions.entryPoints = {
        ...entrypoints,
        ...customEntrypoints,
        ...transportsEntrypoints
      }

      let pinoBundlerRan = false

      currentBuild.onEnd(() => {
        pinoBundlerRan = false
      })

      currentBuild.onLoad({ filter: /pino\.js$/ }, async (args) => {
        if (pinoBundlerRan) return
        pinoBundlerRan = true

        const contents = await readFile(args.path, 'utf8')

        const absoluteOutputPath = join(
          resolve('./'),
          currentBuild.initialOptions.outdir || 'dist'
        ).replace(/\\/g, '/')

        const functionDeclaration = `
          function pinoBundlerAbsolutePath(p) {
            try {
              return require('path').join('${absoluteOutputPath}', p)
            } catch(e) {
              const f = new Function('p', 'return new URL(p, import.meta.url).pathname');
              return f(p)
            }
          }
        `

        const pinoOverrides = Object.keys(customEntrypoints)
          .map(
            (id) =>
              `'${
                id === 'pino-file' ? 'pino/file' : id
              }': pinoBundlerAbsolutePath('./${id}.js')`
          )
          .join(',')

        const globalThisDeclaration = `
          globalThis.__bundlerPathsOverrides =
            globalThis.__bundlerPathsOverrides
                ? {...globalThis.__bundlerPathsOverrides, ${pinoOverrides}}
                : {${pinoOverrides}};
        `

        const code = functionDeclaration + globalThisDeclaration

        return {
          contents: code + contents
        }
      })
    }
  }
}
