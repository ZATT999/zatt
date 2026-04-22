import { Router } from 'express'
import { config } from '../config/index.js'
import { Orchestrator } from '../agents/orchestrator.js'

export function chatRouter({ ollama, tools, getModels }) {
  const router = Router()

  const MAX_HISTORY = 20 // keep last 20 messages (~10 turns) to bound token growth

  router.post('/', async (req, res) => {
    const { messages: rawMessages, model = config.ollama.defaultModel } = req.body
    const messages = rawMessages.slice(-MAX_HISTORY)

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('Access-Control-Allow-Origin', '*')

    const send = (event, data) =>
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)

    // Signal client immediately so it can show a spinner — don't wait for LLM
    send('start', { model })

    try {
      const availableModels = await getModels()

      const orchestrator = new Orchestrator({
        ollama,
        tools,
        send,
        availableModels,
      })

      await orchestrator.run({ messages, orchestratorModel: model })

      send('done', {})
    } catch (err) {
      send('error', { message: err.message })
    } finally {
      res.end()
    }
  })

  return router
}
