// Single job: compress long tool output so downstream models see less tokens.
// Non-streaming. Runs on a small/fast model.
const THRESHOLD = 800 // chars — below this, skip summarization entirely

export class SummarizerAgent {
  #ollama
  #model

  constructor({ ollama, model }) {
    this.#ollama = ollama
    this.#model = model
  }

  async summarize(content) {
    if (!content || content.length <= THRESHOLD) return content

    try {
      const { message } = await this.#ollama.chat({
        model: this.#model,
        stream: false,
        think: false,
        options: { num_predict: 250, temperature: 0.1 },
        messages: [
          {
            role: 'system',
            content: 'Summarize the following command output in 3-5 lines. Keep: errors, key values, file paths, status codes, package names. Drop: verbose logs, repeated lines, progress bars.',
          },
          { role: 'user', content: content.slice(0, 4000) },
        ],
      })
      return message.content.trim()
    } catch {
      return content.slice(0, THRESHOLD) + '\n...(truncado)'
    }
  }
}
