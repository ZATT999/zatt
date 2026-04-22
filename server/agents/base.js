export class BaseAgent {
  constructor({ name, capability, ollama, tools, send }) {
    this.name = name
    this.capability = capability
    this.ollama = ollama
    this.tools = tools
    this.send = send
  }

  // Emit agent-scoped SSE events
  emit(event, data) {
    this.send(event, { agent: this.name, ...data })
  }

  async streamChat({ model, messages, useTools = false }) {
    const opts = {
      model,
      messages,
      stream: true,
      think: false, // disable thinking mode for all sub-agents
      ...(useTools && this.tools ? { tools: this.tools.definitions } : {}),
    }

    const stream = await this.ollama.chat(opts)
    const full = { role: 'assistant', content: '', tool_calls: [] }

    for await (const chunk of stream) {
      const delta = chunk.message
      if (delta.content) {
        full.content += delta.content
        this.emit('agent_token', { content: delta.content })
      }
      if (delta.tool_calls?.length) {
        full.tool_calls.push(...delta.tool_calls)
      }
    }

    return full
  }

  // Override in subclasses
  async run({ task, context, model }) {
    throw new Error(`Agent ${this.name} must implement run()`)
  }
}
