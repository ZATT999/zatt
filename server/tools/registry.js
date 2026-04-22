import { readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))

class ToolRegistry {
  #tools = new Map()

  async load() {
    const files = readdirSync(__dir).filter(
      f => f !== 'registry.js' && f.endsWith('.js')
    )
    for (const file of files) {
      const mod = await import(join(__dir, file))
      const tool = mod.default
      if (!tool?.name) continue
      this.#tools.set(tool.name, tool)
      console.log(`  [tools] loaded: ${tool.name}`)
    }
  }

  // Ollama-compatible tool definitions
  get definitions() {
    return [...this.#tools.values()].map(t => ({
      type: 'function',
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
    }))
  }

  get list() {
    return [...this.#tools.values()].map(({ name, description }) => ({ name, description }))
  }

  async execute(name, args) {
    const tool = this.#tools.get(name)
    if (!tool) throw new Error(`Tool not found: ${name}`)
    return tool.execute(args)
  }

  register(tool) {
    this.#tools.set(tool.name, tool)
  }
}

export const toolRegistry = new ToolRegistry()
