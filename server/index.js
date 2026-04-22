import express from 'express'
import { Ollama } from 'ollama'
import { config } from './config/index.js'
import { toolRegistry } from './tools/registry.js'
import { mcpRegistry } from './mcp/registry.js'
import { skillRegistry } from './skills/registry.js'
import { chatRouter } from './routes/chat.js'
import { modelsRouter } from './routes/models.js'
import { toolsRouter } from './routes/tools.js'
import { uploadRouter } from './routes/upload.js'
import { soulRouter } from './routes/soul.js'
import { memoryRouter } from './routes/memory.js'

async function bootstrap() {
  const ollama = new Ollama({ host: config.ollama.host })

  console.log('Loading tools...')
  await toolRegistry.load()

  // Pre-warm: load default model into VRAM so first user request doesn't pay cold-start
  ollama.chat({
    model: config.ollama.defaultModel,
    messages: [{ role: 'user', content: 'hola' }],
    options: { num_predict: 1 },
  }).then(() => console.log(`Model ${config.ollama.defaultModel} pre-warmed`)).catch(() => {})

  // Future: await mcpRegistry.connect('brave', { ... })
  // Future: skillRegistry.register(mySkill)

  // Model list — cached 30s, shared across all routes
  let _modelsCache = null
  let _modelsCacheAt = 0
  const getModels = async () => {
    const now = Date.now()
    if (!_modelsCache || now - _modelsCacheAt > 30_000) {
      const { models } = await ollama.list()
      _modelsCache = models.map(m => m.name)
      _modelsCacheAt = now
    }
    return _modelsCache
  }

  const app = express()
  app.use(express.json())

  app.use('/api/chat',   chatRouter({ ollama, tools: toolRegistry, getModels }))
  app.use('/api/models', modelsRouter({ ollama }))
  app.use('/api/tools',  toolsRouter({ tools: toolRegistry }))
  app.use('/api/upload', uploadRouter())
  app.use('/api/soul',   soulRouter())
  app.use('/api/memory', memoryRouter())

  app.listen(config.port, () => {
    console.log(`Zatt server → http://localhost:${config.port}`)
    console.log(`Tools: ${toolRegistry.list.map(t => t.name).join(', ')}`)
  })
}

bootstrap().catch(console.error)
