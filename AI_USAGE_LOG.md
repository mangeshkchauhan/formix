# AI Usage Log

How AI tooling was used to build this Form Builder, the prompts that mattered, what was
verified before trusting output, and what was rejected or corrected.

## Prompt 1 — Architecture & extensibility contract

**Refined prompt**
> "I'm building a React 19 + TypeScript form builder (Builder + Fill mode) with 9
> registry field types (Single Line Text, Multi-line Text, Number, Date, Single Select,
> Multi Select, File Upload, Section Header, Calculation), conditional logic as a
> cross-cutting capability on every field, and native-only PDF
> export. Before any code,
> propose a `FieldDefinition` registry so adding a new field type only requires creating
> one file and registering it — no edits to the palette, config panel, fill renderer,
> validation, or PDF code. Give me the discriminated-union field types and the registry
> interface. No `any`."

**What I verified**
- That the registry interface actually covers *every* surface that varies by type
  (palette, config UI, renderer, empty value, validate, PDF serialization, condition
  operators). I cross-checked each spec field type against the interface to ensure none
  needed a special case outside the registry.
- That the discriminated union made `switch (field.type)` exhaustive (TS errors when a
  case is missing).
- That the spec’s **10 capabilities** = **9 registered field types** plus **conditional logic** as a cross-cutting capability (not a tenth `FieldType`).

**What I changed**
- The first version put `required` as a top-level field property *and* inside per-type
  config. I collapsed it to a single `defaultRequired` to avoid two sources of truth,
  since conditional logic also toggles required.

---

## Prompt 2 — Conditional logic semantics (the hard part)

**Refined prompt**
> "Implement a pure function `resolveFieldStates(fields, values)` returning
> `{ visible, required }` per field. Requirements: a field can have multiple conditions
> with effects show/hide/require/unrequire; a hidden field's value must not count for
> other conditions; support chained conditions (A depends on B depends on C); never mark
> a hidden field required. Recommend AND vs OR semantics for multiple conditions and
> justify it."

**What I verified**
- Tested chains manually: A shows when B = "x", B shows when C = "yes". Toggling C
  correctly cascaded to A.
- Verified the **fixpoint loop** terminates (cycle guard) and that hidden targets are
  treated as empty.
- Confirmed hidden-but-required fields are skipped by validation.

**What I changed**
- The AI initially proposed a single AND across all conditions. I rejected this: it
  can't express conditions with *different* effects (e.g. "show on X" + "require on Y").
  Switched to **independent, ordered, last-match-wins per dimension** and documented it.

---

## Prompt 3 — Native PDF export (no libraries)

**Refined prompt**
> "Export a filled form to PDF using browser-native APIs only — no jsPDF/pdfmake/etc.
> Build a self-contained styled HTML document (title, submission timestamp, visible
> field labels + formatted values in form order, hidden fields omitted) and trigger the
> browser print dialog. It must also work for re-download from a stored instance. File
> upload fields show metadata only with a 'not embedded' note."

**What I verified**
- That hidden fields (via conditional logic) were genuinely absent from the output, not
  just visually hidden — I re-resolved visibility from stored values, not from live DOM.
- That re-download from the Instances list produced identical output to post-submit.
- Print output rendered values, not `[object Object]`, for selects/multiselect/files.

**What I changed**
- The first approach called `window.print()` on the live app with `@media print` hacks,
  which leaked builder chrome into the PDF. Replaced with a **hidden iframe containing a
  generated document**, giving full control over layout and isolation.

---

## Prompt 4 — Real-time calculation field

**Refined prompt**
> "Add a read-only Calculation field that aggregates (sum/avg/min/max) selected Number
> fields and updates in real time as the user types. Exclude hidden source fields.
> Average ignores empty sources. A calculation cannot source another calculation. Show
> `—` when there's nothing to compute. Round to a configurable 0–4 decimals."

**What I verified**
- Live updates as source numbers change; hidden sources dropped from the result.
- Source picker only lists Number fields (no calculation-on-calculation).
- Average divides by count of *filled* sources, not total sources.

**What I changed**
- Nothing structural; tightened rounding to use a single shared `round(value, decimals)`
  helper reused by the Number field formatter for consistency.

---

## Prompt 5 — Builder DnD + config panel wiring

**Refined prompt**
> "Wire dnd-kit so the left palette adds a field to the center canvas (click or drag),
> the canvas list is reorderable with a keyboard-accessible up/down fallback, and option
> lists inside Single/Multi Select are reorderable. The right config panel must render
> the selected field's config purely from the registry's `ConfigPanel`."

**What I verified**
- Keyboard reordering works (dnd-kit keyboard sensor) and up/down buttons mutate order
  identically.
- Adding a field via the registry factory produced a valid default config that passed
  validation immediately.

**What I changed**
- Added stable `id`s to options up front; the AI keyed option rows by array index, which
  caused inputs to lose focus / swap values on reorder.

---

## Prompt 6 (REQUIRED EXAMPLE) — Plausible but INCORRECT AI output

**Prompt**
> "Write the submit-time validation that enforces required fields and per-type rules."

**What the AI produced (plausible but wrong)**
It generated validation that iterated **all** fields and checked `field.defaultRequired`
to decide if a value was mandatory:

```ts
for (const field of fields) {
  if (field.defaultRequired && isEmpty(values[field.id])) {
    errors[field.id] = 'This field is required';
  }
}
```

**Why it's incorrect**
This violates two core spec rules:
1. It uses `defaultRequired` instead of the **computed** required state, so a field made
   *not required* by a condition would still be validated as required (and vice-versa).
2. It validates **hidden** fields — a hidden required field must never block submission.

**The correction**
Validation now consumes `resolveFieldStates(...)` first and only checks **visible**
fields against their **computed** `required` value:

```ts
const states = resolveFieldStates(fields, values);
for (const field of fields) {
  const s = states[field.id];
  if (!s.visible) continue;                 // hidden fields are never validated
  if (s.required && isEmpty(values[field.id])) errors[field.id] = 'This field is required';
  const msg = fieldRegistry[field.type].validate(field, values[field.id]);
  if (msg) errors[field.id] = msg;
}
```

I caught this by testing a field marked required with a `hide` condition active — the
original code blocked submission; the corrected code submits correctly and the field is
excluded from the PDF.
