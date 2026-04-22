import { promises as fs } from 'fs'
import { dirname } from 'path'

export default {
  name: 'write_file',
  description: 'Crea o sobreescribe un archivo. Crea directorios necesarios automáticamente.',
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Ruta completa del archivo' },
      content: { type: 'string', description: 'Contenido a escribir' },
    },
    required: ['path', 'content'],
  },
  async execute({ path, content }) {
    try {
      await fs.mkdir(dirname(path), { recursive: true })
      await fs.writeFile(path, content, 'utf-8')
      return `Archivo escrito: ${path}`
    } catch (err) {
      return `ERROR: ${err.message}`
    }
  },
}
