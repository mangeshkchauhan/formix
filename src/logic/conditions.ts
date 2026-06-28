import { fieldRegistry } from '../fields/registry'
import type { AnyField, Condition, FieldValue } from '../fields/types'

export interface FieldState {
  visible: boolean
  required: boolean
}

export type FieldStates = Record<string, FieldState>

/**
 * Applies a single condition's effect to a state, mutating dimensions in place.
 * Conditions are applied in declaration order; the last matching condition wins
 * per dimension (visibility and required are independent). This is more expressive
 * than a single AND/OR because conditions can carry different effects.
 */
function applyEffect(state: FieldState, effect: Condition['effect']): void {
  switch (effect) {
    case 'show':
      state.visible = true
      break
    case 'hide':
      state.visible = false
      break
    case 'require':
      state.required = true
      break
    case 'unrequire':
      state.required = false
      break
  }
}

/**
 * Resolves the visible/required state of every field given the current answers.
 *
 * - A hidden target field's value is treated as empty when evaluating conditions.
 * - States are resolved by iterating to a fixpoint so chained conditions (A->B->C)
 *   converge; a cycle guard bounds the iterations.
 * - A hidden field is never required.
 */
export function resolveFieldStates(
  fields: AnyField[],
  values: Record<string, FieldValue>,
): FieldStates {
  const byId = new Map(fields.map((field) => [field.id, field]))

  let states: FieldStates = {}
  for (const field of fields) {
    states[field.id] = {
      visible: field.defaultVisible,
      required: field.defaultRequired,
    }
  }

  const maxIterations = fields.length + 2
  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    const next: FieldStates = {}
    let changed = false

    for (const field of fields) {
      const state: FieldState = {
        visible: field.defaultVisible,
        required: field.defaultRequired,
      }

      for (const condition of field.conditions) {
        // A field cannot depend on itself.
        if (condition.targetFieldId === field.id) continue
        const target = byId.get(condition.targetFieldId)
        if (!target) continue

        const definition = fieldRegistry[target.type]
        if (!definition.evaluate) continue

        // A hidden target contributes no value.
        const targetVisible = states[target.id]?.visible ?? target.defaultVisible
        const targetValue: FieldValue = targetVisible
          ? (values[target.id] ?? null)
          : null

        if (definition.evaluate(condition.operator, targetValue, condition.value)) {
          applyEffect(state, condition.effect)
        }
      }

      // Rule: a hidden field is never validated as required.
      if (!state.visible) state.required = false

      const prev = states[field.id]
      if (prev.visible !== state.visible || prev.required !== state.required) {
        changed = true
      }
      next[field.id] = state
    }

    states = next
    if (!changed) break
  }

  return states
}

/** Convenience: list of field ids that are currently visible. */
export function visibleFieldIds(states: FieldStates): Set<string> {
  return new Set(
    Object.entries(states)
      .filter(([, state]) => state.visible)
      .map(([id]) => id),
  )
}
