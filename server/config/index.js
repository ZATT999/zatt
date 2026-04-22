export const config = {
  port: process.env.PORT ?? 3001,
  ollama: {
    host: process.env.OLLAMA_HOST ?? 'http://localhost:11434',
    defaultModel: process.env.DEFAULT_MODEL ?? 'qwen3:8b',
    embedModel: process.env.EMBED_MODEL ?? 'nomic-embed-text',
    // Set EXTRACT_MODEL to a small/fast model (e.g. qwen2.5:1.5b) to avoid double main-model calls
    extractModel: process.env.EXTRACT_MODEL ?? 'qwen3:8b',
    // Micro-agent models — set small/fast models for best latency
    // ROUTER_MODEL: classifies intent (smallest available, e.g. qwen2.5:0.5b or llama3.2:1b)
    // PLANNER_MODEL: breaks complex tasks into steps (medium, e.g. qwen2.5:3b)
    // SUMMARIZER_MODEL: compresses long outputs (smallest, same as ROUTER_MODEL is fine)
    routerModel: process.env.ROUTER_MODEL ?? null,     // null → auto-pick smallest
    plannerModel: process.env.PLANNER_MODEL ?? null,   // null → fallback to defaultModel
    summarizerModel: process.env.SUMMARIZER_MODEL ?? null, // null → same as routerModel
    maxIterations: 10,
  },
  // Base system prompt — the soul is prepended dynamically at request time
  systemPrompt: `Sos Zatt, un agente de sistema operativo con acceso completo al sistema Linux.
Respondés siempre en español colombiano, natural y directo.
Usá las herramientas disponibles para cumplir los pedidos.
Podés encadenar múltiples herramientas.
Explicá brevemente qué vas a hacer y reportá los resultados.`,
}
