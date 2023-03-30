import { build } from 'esbuild'
import esbuildPluginPino from '../../dist'

const distFolder = 'test/dist'

build({
  entryPoints: [
    {
      in: './test/fixtures/first.js',
      out: 'first'
    },
    {
      in: './test/fixtures/second.js',
      out: 'abc/cde/second'
    }
  ],
  logLevel: 'info',
  outdir: distFolder,
  bundle: true,
  platform: 'node',
  format: 'cjs',
  plugins: [esbuildPluginPino({ transports: ['pino-pretty'] })]
}).catch(() => process.exit(1))
