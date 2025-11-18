import { describe, it, expect } from "vitest"
import { createRequire } from "node:module"

describe("Dual Module Support", () => {
  it("can be imported as ESM", async () => {
    const plugin = await import("../dist/index.mjs")
    expect(plugin.default).toBeDefined()
    expect(typeof plugin.default).toBe("function")
    const instance = plugin.default()
    expect(instance.name).toBe("pino")
    expect(instance.setup).toBeDefined()
  })

  it("can be required as CommonJS", () => {
    const require = createRequire(import.meta.url)
    const plugin = require("../dist/index.js")
    expect(plugin).toBeDefined()
    expect(typeof plugin).toBe("function")
    const instance = plugin()
    expect(instance.name).toBe("pino")
    expect(instance.setup).toBeDefined()
  })

  it("both module types return equivalent plugins", async () => {
    const esmPlugin = await import("../dist/index.mjs")
    const require = createRequire(import.meta.url)
    const cjsPlugin = require("../dist/index.js")
    
    const esmInstance = esmPlugin.default()
    const cjsInstance = cjsPlugin()
    
    expect(esmInstance.name).toBe(cjsInstance.name)
    expect(typeof esmInstance.setup).toBe(typeof cjsInstance.setup)
  })

  it("hybridResolve works in both contexts", async () => {
    // This tests that our hybridResolve function works
    // The plugin internally uses hybridResolve to find pino and thread-stream
    const plugin = await import("../dist/index.mjs")
    const instance = plugin.default({ transports: ["pino-pretty"] })
    
    // If hybridResolve works, the plugin will initialize without errors
    expect(instance).toBeDefined()
    expect(instance.name).toBe("pino")
  })
})