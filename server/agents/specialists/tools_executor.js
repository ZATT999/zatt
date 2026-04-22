import { BaseAgent } from '../base.js'
import { config } from '../../config/index.js'

export class ToolsExecutorAgent extends BaseAgent {
  constructor(opts) {
    super({ ...opts, name: 'tools', capability: 'tools' })
  }

  async run({ task, context, model }) {
    this.emit('agent_start', { model, task })

    const messages = [
      { role: 'system', content: config.systemPrompt },
      ...(context ?? []),
      { role: 'user', content: task },
    ]

    let iterations = 0
    const MAX = config.ollama.maxIterations

    while (iterations++ < MAX) {
      const full = await this.streamChat({ model, messages, useTools: true })
      messages.push(full)

      if (!full.tool_calls.length) {
        this.emit('agent_end', { result: full.content })
        return full.content
      }

      for (const call of full.tool_calls) {
        const name = call.function.name
        const args = call.function.arguments

        this.send('tool_call', { agent: this.name, name, args })
        const result = await this.tools.execute(name, args)
        this.send('tool_result', { agent: this.name, name, result })

        messages.push({ role: 'tool', content: result })
      }
    }

    this.emit('agent_end', { result: '(max iteraciones alcanzado)' })
    return '(max iteraciones alcanzado)'
  }
}
