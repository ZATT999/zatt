// Single job: convert a task description into a shell command.
// Non-streaming, JSON output. Runs on the smallest available model.
export class CommandBuilderAgent {
  #ollama
  #model

  constructor({ ollama, model }) {
    this.#ollama = ollama
    this.#model = model
  }

  // context: optional string with results from previous steps
  async build(task, context = '') {
    try {
      const input = context
        ? `Previous results:\n${context}\n\nTask: ${task}`
        : task

      const { message } = await this.#ollama.chat({
        model: this.#model,
        format: 'json',
        stream: false,
        think: false,
        options: { num_predict: 128, temperature: 0 },
        messages: [
          {
            role: 'system',
            content: `Convert the task to a single Linux bash command. Return ONLY valid JSON: {"command":"...","cwd":null}

Rules:
- One command (pipes and && are fine for compound ops)
- cwd: absolute working directory path, or null to use user home
- Prefer safe, non-destructive operations
- No interactive prompts (use -y, --yes, --force flags where needed)
- No sudo unless the task explicitly requires elevated privileges`,
          },
          { role: 'user', content: input },
        ],
      })

      const parsed = JSON.parse(message.content)
      if (typeof parsed.command === 'string' && parsed.command.trim()) return parsed
    } catch {
      // fallthrough
    }
    return { command: task, cwd: null }
  }
}
