import { BaseAgent } from '../base.js'
import { promises as fs } from 'fs'

export class VisionAgent extends BaseAgent {
  constructor(opts) {
    super({ ...opts, name: 'vision', capability: 'vision' })
  }

  async run({ task, context, model, imagePaths = [] }) {
    this.emit('agent_start', { model, task })

    // Load images as base64
    const images = []
    for (const p of imagePaths) {
      try {
        const buf = await fs.readFile(p)
        images.push(buf.toString('base64'))
      } catch (err) {
        this.emit('agent_token', { content: `[No se pudo leer imagen: ${p}]\n` })
      }
    }

    const messages = [
      {
        role: 'system',
        content: 'Analizá las imágenes con detalle. Respondé en español colombiano.',
      },
      ...(context ?? []),
      {
        role: 'user',
        content: task,
        ...(images.length ? { images } : {}),
      },
    ]

    const result = await this.streamChat({ model, messages, useTools: false })

    this.emit('agent_end', { result: result.content })
    return result.content
  }
}
