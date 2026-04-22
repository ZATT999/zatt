import { config } from '../config/index.js'

/**
 * Runs the tool-calling agent loop.
 * @param {object} opts
 * @param {object[]} opts.messages   - Conversation history (mutated in place)
 * @param {string}   opts.model      - Model name
 * @param {object}   opts.ollama     - Ollama client instance
 * @param {object}   opts.tools      - ToolRegistry instance
 * @param {Function} opts.send       - SSE send function: send(event, data)
 */
export async function runAgent({ messages, model, ollama, tools, send }) {
  const { maxIterations } = config.ollama
  let iterations = 0

  while (iterations++ < maxIterations) {
    const stream = await ollama.chat({
      model,
      messages,
      tools: tools.definitions,
      stream: true,
    })

    const fullMessage = { role: 'assistant', content: '', tool_calls: [] }

    for await (const chunk of stream) {
      const delta = chunk.message
      if (delta.content) {
        fullMessage.content += delta.content
        send('token', { content: delta.content })
      }
      if (delta.tool_calls?.length) {
        fullMessage.tool_calls.push(...delta.tool_calls)
      }
    }

    messages.push(fullMessage)
    if (!fullMessage.tool_calls.length) break

    for (const call of fullMessage.tool_calls) {
      const name = call.function.name
      const args = call.function.arguments

      send('tool_call', { name, args })
      const result = await tools.execute(name, args)
      send('tool_result', { name, result })
      messages.push({ role: 'tool', content: result })
    }
  }
}
