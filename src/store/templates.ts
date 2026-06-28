import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AnyField, FormTemplate } from '../fields/types'
import { createId } from '../lib/id'

interface TemplatesState {
  templates: FormTemplate[]
  /** Builds a blank template in memory WITHOUT persisting it (draft). */
  createDraft: () => FormTemplate
  getTemplate: (id: string) => FormTemplate | undefined
  /** Inserts a new template (used when saving a draft for the first time). */
  addTemplate: (template: FormTemplate) => void
  saveTemplate: (template: FormTemplate) => void
  updateTemplateFields: (id: string, fields: AnyField[], title: string) => void
  toggleFavorite: (id: string) => void
  deleteTemplate: (id: string) => void
}

function nowIso(): string {
  return new Date().toISOString()
}

export function createDraftTemplate(): FormTemplate {
  return {
    id: createId('tpl'),
    title: 'Untitled form',
    fields: [],
    favorite: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
}

export const useTemplatesStore = create<TemplatesState>()(
  persist(
    (set, get) => ({
      templates: [],

      createDraft: createDraftTemplate,

      getTemplate: (id) => get().templates.find((t) => t.id === id),

      addTemplate: (template) =>
        set((state) => ({
          templates: [...state.templates, { ...template, updatedAt: nowIso() }],
        })),

      saveTemplate: (template) =>
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === template.id ? { ...template, updatedAt: nowIso() } : t,
          ),
        })),

      updateTemplateFields: (id, fields, title) =>
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id ? { ...t, fields, title, updatedAt: nowIso() } : t,
          ),
        })),

      toggleFavorite: (id) =>
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id ? { ...t, favorite: !t.favorite } : t,
          ),
        })),

      deleteTemplate: (id) =>
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
        })),
    }),
    {
      name: 'formix:templates:v1',
      version: 2,
      migrate: (persisted) => {
        const state = persisted as { templates?: FormTemplate[] }
        if (state?.templates) {
          state.templates = state.templates.map((t) => ({
            ...t,
            favorite: t.favorite ?? false,
          }))
        }
        return state as TemplatesState
      },
    },
  ),
)
