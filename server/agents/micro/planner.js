// Single job: break a complex task into atomic sequential steps.
// Non-streaming, JSON output. Runs on a small/fast model.
export class PlannerAgent {
  #ollama
  #model

  constructor({ ollama, model }) {
    this.#ollama = ollama
    this.#model = model
  }

  async plan(task, intent) {
    try {
      const { message } = await this.#ollama.chat({
        model: this.#model,
        format: 'json',
        stream: false,
        think: false,
        options: { num_predict: 350, temperature: 0.1 },
        messages: [
          {
            role: 'system',
            content: `Break the task into numbered atomic steps. Return ONLY valid JSON:
{"steps":[{"id":1,"description":"specific atomic action","type":"${intent}"}]}

Rules:
- Maximum 6 steps
- Each step = one concrete executable action
- Steps are sequential (each may depend on the previous)
- description must be specific enough to act on directly
- type must be "${intent}" for all steps`,
          },
          { role: 'user', content: task },
        ],
      })
      const parsed = JSON.parse(message.content)
      if (Array.isArray(parsed.steps) && parsed.steps.length > 0) return parsed.steps
    } catch {
      // fallthrough
    }
    return [{ id: 1, description: task, type: intent }]
  }
}
