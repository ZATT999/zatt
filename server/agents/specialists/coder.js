import { BaseAgent } from '../base.js'

export class CoderAgent extends BaseAgent {
  constructor(opts) {
    super({ ...opts, name: 'coder', capability: 'code' })
  }

  async run({ task, context, model }) {
    this.emit('agent_start', { model, task })

    const messages = [
      {
        role: 'system',
        content: `Sos un experto en programación. Tu único trabajo es escribir código correcto, limpio y funcional.
No explicás en exceso — código primero, explicación mínima después.
Respondé en español colombiano.`,
      },
      ...(context ?? []),
      { role: 'user', content: task },
    ]

    const result = await this.streamChat({ model, messages, useTools: false })

    this.emit('agent_end', { result: result.content })
    return result.content
  }
}
