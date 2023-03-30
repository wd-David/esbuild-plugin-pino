# esbuild-plugin-pino

[![NPM version](https://img.shields.io/npm/v/esbuild-plugin-pino?logo=NPM)](https://www.npmjs.com/package/esbuild-plugin-pino)
![npm bundle size](https://img.shields.io/bundlephobia/min/esbuild-plugin-pino)
![CI](https://github.com/davipon/esbuild-plugin-pino/actions/workflows/ci.yml/badge.svg)
![Release](https://github.com/davipon/esbuild-plugin-pino/actions/workflows/release.yml/badge.svg)
![license](https://img.shields.io/github/license/davipon/esbuild-plugin-pino)

An esbuild plugin to generate extra pino files for bundling

## Installation

```bash
npm install esbuild-plugin-pino
```

## Description

This plugin allows to use of pino v7 with esbuild generated bundle files.

Note that, due to pino architecture (based on Node.js' Worker Threads), it is not possible to make it work without generating extra files.

This means that when using this plugin the following list of files will be generated at the root of your dist folder:

- `thread-stream.js`
- `pino-worker.js`
- `pino-pipeline-worker.js`
- `pino-file.js`

A file for each transport you specify in the plugin constructor's `transports` option. (see below)
Each of the additional file is a bundle and therefore does not contain any external dependency, but it is needed to use pino and it must be included in the deployment.

## Usage

Simply include the plugin in your esbuild build script. Make sure you provide the plugin a list of all the pino transports you use via the `transports` option (`pino/file` is always included so no need to specify it).

```js
// General usage
const { build } = require('esbuild')
const esbuildPluginPino = require('esbuild-plugin-pino')

build({
  entryPoints: ['src/index.ts'],
  outdir: 'dist',
  plugins: [esbuildPluginPino({ transports: ['pino-pretty'] })],
}).catch(() => process.exit(1))
```

```js
// Multiple entryPoints & pino transports
const { build } = require('esbuild')
const esbuildPluginPino = require('esbuild-plugin-pino')

build({
  entryPoints: {
    first: './first.js',
    'abc/cde/second': './second.js'
  },
  outdir: 'dist',
  plugins: [esbuildPluginPino({ transports: ['pino-pretty', 'pino-loki'] })],
}).catch(() => process.exit(1))
```

```js
// Start from esbuild@^0.17.1
// Multiple entryPoints in an array of object & pino transports
const { build } = require('esbuild')
const esbuildPluginPino = require('esbuild-plugin-pino')

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
  outdir: 'dist',
  plugins: [esbuildPluginPino({ transports: ['pino-pretty', 'pino-loki'] })],
}).catch(() => process.exit(1))
```

## Deploy to production

If you use `docker` or severless function like AWS Lambda, make sure to use the same `outdir` in your production.
Ex: If your `outdir` is set to `dist` in `esbuild`, you need to copy the whole `dist` but not extracting files into the docker image root folder.

## Credits

- Reference: [Pino Bundling](https://github.com/pinojs/pino/blob/master/docs/bundling.md)
- Inspired by [pino-esbuild.js](https://gist.github.com/ShogunPanda/752cce88659a09bff827ef8d2ecf8c80#gistcomment-4199018) and kudos to [@ShogunPanda](https://github.com/ShogunPanda) & [@scorsi](https://github.com/scorsi)
