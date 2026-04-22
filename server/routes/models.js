import { Router } from 'express'

export function modelsRouter({ ollama }) {
  const router = Router()

  router.get('/', async (req, res) => {
    try {
      const { models } = await ollama.list()
      const local = models
        .map(m => m.name)
      res.json(local)
    } catch {
      res.status(500).json({ error: 'No se pudo conectar a Ollama' })
    }
  })

  return router
}
