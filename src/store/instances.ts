import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { FieldValue, FormInstance } from '../fields/types'
import { createId } from '../lib/id'

interface InstancesState {
  instances: FormInstance[]
  addInstance: (
    templateId: string,
    values: Record<string, FieldValue>,
  ) => FormInstance
  getInstance: (id: string) => FormInstance | undefined
  instancesForTemplate: (templateId: string) => FormInstance[]
  countForTemplate: (templateId: string) => number
  deleteInstance: (id: string) => void
  deleteInstancesForTemplate: (templateId: string) => void
}

export const useInstancesStore = create<InstancesState>()(
  persist(
    (set, get) => ({
      instances: [],

      addInstance: (templateId, values) => {
        const instance: FormInstance = {
          id: createId('ins'),
          templateId,
          values,
          submittedAt: new Date().toISOString(),
        }
        set((state) => ({ instances: [...state.instances, instance] }))
        return instance
      },

      getInstance: (id) => get().instances.find((i) => i.id === id),

      instancesForTemplate: (templateId) =>
        get().instances.filter((i) => i.templateId === templateId),

      countForTemplate: (templateId) =>
        get().instances.filter((i) => i.templateId === templateId).length,

      deleteInstance: (id) =>
        set((state) => ({
          instances: state.instances.filter((i) => i.id !== id),
        })),

      deleteInstancesForTemplate: (templateId) =>
        set((state) => ({
          instances: state.instances.filter((i) => i.templateId !== templateId),
        })),
    }),
    {
      name: 'formix:instances:v1',
      version: 1,
    },
  ),
)
