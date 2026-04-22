import { Router } from 'express'

export function toolsRouter({ tools }) {
  const router = Router()

  router.get('/', (req, res) => {
    res.json(tools.list)
  })

  return router
}
