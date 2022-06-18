import { build } from 'esbuild'
import esbuildPluginPino from '../../dist'

const distFolder = 'test/dist'

build({
  entryPoints: ['./test/fixtures/third.ts'],
  logLevel: 'info',
  outdir: distFolder,
  bundle: true,
  platform: 'node',
  format: 'cjs',
  plugins: [esbuildPluginPino({ transports: ['pino-loki', 'pino-pretty'] })]
}).catch(() => process.exit(1))
