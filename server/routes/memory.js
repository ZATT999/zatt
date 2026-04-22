import { Router } from 'express'
import { save, list, remove } from '../memory/index.js'

export function memoryRouter() {
  const router = Router()

  router.get('/', (req, res) => {
    res.json(list())
  })

  router.post('/', async (req, res) => {
    const { content, type } = req.body
    if (!content) return res.status(400).json({ error: 'content requerido' })
    const result = await save(content, type)
    res.json({ id: result.lastInsertRowid })
  })

  router.delete('/:id', (req, res) => {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) return res.status(400).json({ error: 'id inválido' })
    remove(id)
    res.json({ ok: true })
  })

  return router
}
