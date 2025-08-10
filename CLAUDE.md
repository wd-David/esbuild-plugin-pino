# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an esbuild plugin that enables the use of Pino logger (v7-v9) with esbuild-generated bundles. The plugin works by automatically generating additional worker files required by Pino's architecture based on Node.js Worker Threads.

## Key Commands

- `npm run build` - Build the plugin using pkgroll
- `npm test` - Build and run tests with Vitest  
- `npm run check` - Run Biome linter and formatter
- `npm run dev` - Watch mode using nodemon (builds and tests on changes)

## Architecture

### Core Plugin Logic (`src/index.ts`)
- Single file containing the main esbuild plugin
- Handles three entrypoint formats: string array, object record, and array of objects
- Automatically adds required Pino worker files and transport files to the build
- Injects path resolution logic into bundled Pino to locate worker files

### Required Generated Files
The plugin generates these additional files in the output directory:
- `thread-stream-worker.js` - Thread stream functionality
- `pino-worker.js` - Main Pino worker
- `pino-pipeline-worker.js` - Pipeline worker (removed in Pino v9.1+)  
- `pino-file.js` - File transport
- Transport-specific files (e.g., `pino-pretty.js`, `pino-loki.js`)

### Test Structure
- Comprehensive tests in `test/index.test.ts` using Vitest
- Build scripts in `test/buildScripts/` test different entrypoint configurations
- Tests verify correct file generation and runtime execution

## Configuration

- **TypeScript**: Strict mode enabled with CommonJS output
- **Biome**: Linting and formatting with space indentation and minimal semicolons
- **Build Tool**: pkgroll for dual CJS/ESM output with TypeScript declarations
- **Testing**: Vitest with Node.js execution tests using execa

## Development Notes

- Plugin supports esbuild versions 0.25.0 to 0.25.8 as peer dependency
- Handles cross-platform path separators (Windows vs Unix)
- Uses dynamic require.resolve() to locate Pino and transport modules
- Automatically detects and handles removal of pipeline worker in newer Pino versions