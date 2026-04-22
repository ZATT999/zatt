import { promises as fs } from 'fs'

export default {
  name: 'create_directory',
  description: 'Crea una carpeta (y todas las carpetas padre necesarias).',
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Ruta completa de la carpeta a crear' },
    },
    required: ['path'],
  },
  async execute({ path }) {
    try {
      await fs.mkdir(path, { recursive: true })
      return `Carpeta creada: ${path}`
    } catch (err) {
      return `ERROR: ${err.message}`
    }
  },
}
