import { create } from 'zustand'

export const useModelStore = create((set) => ({
  model: 'llama3.1',
  models: [],

  setModel: (model) => set({ model }),

  fetchModels: async () => {
    try {
      const res = await fetch('/api/models')
      const models = await res.json()
      if (Array.isArray(models) && models.length > 0) {
        set({ models, model: models[0] })
      }
    } catch {
      set({ models: ['llama3.1'] })
    }
  },
}))
