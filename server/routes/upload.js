import { Router } from 'express'
import multer from 'multer'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const UPLOADS_DIR = join(__dir, '../../uploads')

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (req, file, cb) => {
    const ts = Date.now()
    cb(null, `${ts}-${file.originalname}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
})

export function uploadRouter() {
  const router = Router()

  router.post('/', upload.array('files', 10), (req, res) => {
    const files = req.files.map(f => ({
      name: f.originalname,
      path: f.path,
      size: f.size,
      mime: f.mimetype,
    }))
    res.json({ files })
  })

  return router
}
