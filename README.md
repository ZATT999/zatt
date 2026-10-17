# Zatt

Agente de sistema operativo local para Linux que funciona con modelos de [Ollama](https://ollama.com). Combina un pipeline de micro-agentes, memoria semántica persistente y herramientas de sistema, con una interfaz de chat web.

> **Aviso:** Zatt puede ejecutar comandos de shell y escribir archivos en la máquina donde corre. Úsalo solo en entornos de confianza.

## Funcionalidades

- **Pipeline de micro-agentes:** un agente *router* clasifica cada mensaje por intención (`chat`, `shell`, `file`, `mixed`, `code`, `vision`) y complejidad, y lo envía al pipeline adecuado.
  - **Shell:** *planner* (para tareas complejas) → *command builder* → ejecución → *summarizer* → respuesta final del modelo principal.
  - **Archivos / mixto:** agente ejecutor con acceso completo a las herramientas.
  - **Código** y **visión:** agentes especialistas (`coder`, `vision`).
- **Selección automática de modelos:** elige el modelo instalado más adecuado según la capacidad requerida (chat, herramientas, código, visión) y usa el más pequeño para los micro-agentes.
- **Memoria semántica:** extrae hechos relevantes de las conversaciones, los guarda con embeddings en SQLite y recupera los más similares (similitud coseno) en cada solicitud.
- **"Alma" configurable:** `server/soul/heart.json` define usuario, personalidad y reglas; se combina con información del sistema (SO, kernel, host, shell, disco libre).
- **Herramientas de sistema:** `execute_command`, `read_file`, `write_file`, `list_directory`, `create_directory`.
- **Subida de archivos** (hasta 10 archivos de 50 MB) para usarlos en la conversación, por ejemplo imágenes para el agente de visión.
- **Respuestas en streaming** mediante Server-Sent Events, con eventos de ruta, plan y llamadas a herramientas visibles en la interfaz.
- Registros de MCP y *skills* preparados como base para extensiones futuras (aún sin implementar).

## Stack

- **Backend:** Node.js, Express 4, cliente `ollama`, better-sqlite3, multer.
- **Frontend:** React 18, Vite 5, Zustand, Tailwind CSS 3.

## Requisitos

- Linux.
- Node.js y npm.
- Ollama en ejecución con al menos un modelo de chat y el modelo de embeddings (por defecto `qwen3:8b` y `nomic-embed-text`):

```bash
ollama pull qwen3:8b
ollama pull nomic-embed-text
```

## Instalación y uso

```bash
npm install
npm run dev       # Inicia el servidor (puerto 3001) y Vite en paralelo
```

Vite redirige las peticiones `/api` a `http://localhost:3001`.

```bash
npm run build     # Build de producción del frontend
npm run preview   # Previsualiza el build
```

Los datos se guardan localmente en `data/zatt.db` (memoria) y `uploads/` (archivos subidos).

## API

| Ruta | Descripción |
|------|-------------|
| `POST /api/chat` | Conversación con el agente (streaming SSE) |
| `GET /api/models` | Modelos disponibles en Ollama |
| `GET /api/tools` | Herramientas registradas |
| `POST /api/upload` | Subida de archivos |
| `GET /api/soul/heart`, `GET /api/soul/preview` | Configuración y vista previa del "alma" |
| `GET/POST /api/memory`, `DELETE /api/memory/:id` | Gestión de la memoria |

## Variables de entorno

Todas son opcionales y se leen del entorno del proceso:

| Variable | Uso |
|----------|-----|
| `PORT` | Puerto del servidor (por defecto `3001`) |
| `OLLAMA_HOST` | URL de Ollama (por defecto `http://localhost:11434`) |
| `DEFAULT_MODEL` | Modelo principal |
| `EMBED_MODEL` | Modelo de embeddings para la memoria |
| `EXTRACT_MODEL` | Modelo para extraer hechos a memorizar |
| `ROUTER_MODEL` | Modelo del router (por defecto, el más pequeño disponible) |
| `PLANNER_MODEL` | Modelo del planner |
| `SUMMARIZER_MODEL` | Modelo del summarizer |
