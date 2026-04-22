/**
 * MCP (Model Context Protocol) registry.
 * Connects external MCP servers and exposes their tools to the agent.
 *
 * Usage (future):
 *   mcpRegistry.connect('filesystem', { transport: 'stdio', command: 'npx @modelcontextprotocol/server-filesystem' })
 *   mcpRegistry.connect('brave-search', { transport: 'stdio', command: 'npx @modelcontextprotocol/server-brave-search' })
 */
class McpRegistry {
  #servers = new Map()

  async connect(name, config) {
    // TODO: import @modelcontextprotocol/sdk and connect
    console.log(`  [mcp] registered server: ${name} (stub)`)
    this.#servers.set(name, { name, config, tools: [] })
  }

  async getTools() {
    // Returns all tools from all connected MCP servers as tool definitions
    const tools = []
    for (const server of this.#servers.values()) {
      tools.push(...server.tools)
    }
    return tools
  }

  get list() {
    return [...this.#servers.keys()]
  }
}

export const mcpRegistry = new McpRegistry()
