#!/usr/bin/node
const { build } = require('esbuild')
const esbuildPluginPino = require('../../dist')

const distFolder = 'test/dist'

build({
  entryPoints: {
    first: './test/fixtures/first.js',
    'abc/cde/second': './test/fixtures/second.js'
  },
  logLevel: 'info',
  outdir: distFolder,
  bundle: true,
  platform: 'node',
  format: 'cjs',
  plugins: [esbuildPluginPino({ transports: ['pino-pretty'] })]
}).catch(() => process.exit(1))