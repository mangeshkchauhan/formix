# Formix

A browser-based form builder — design form templates in **Builder Mode**, fill them out
in **Fill Mode**, and export submissions as PDF. Everything is stored in `localStorage`;
there is no backend.

Built with **Next.js 16 (App Router) + React 19 + TypeScript**, **Tailwind CSS v4**,
**Zustand**, and **dnd-kit**. PDF export uses **browser-native APIs only** (no PDF
libraries).

---

## Running locally

This project uses **bun** (a `bun.lock` is committed; `packageManager` is pinned to
`bun@1.2.10`).

```bash
bun install
bun dev          # start the dev server (http://localhost:3000)
bun run build    # production build
bun start        # serve the production build
bun run lint     # run ESLint (eslint-config-next)
bun run typecheck # tsc --noEmit
```

---

## Features

- **10 spec capabilities** — **9 registered field types** in `src/fields/registry.ts`
  plus **conditional logic** as a cross-cutting capability:
  - **Field types:** Single Line Text, Multi-line Text, Number, Date, Single Select
    (radio / dropdown / tiles), Multi Select, File Upload (metadata only), Section
    Header, and Calculation.
  - **Capability (not a type):** Conditional Logic — available on every field via
    `conditions` and configured in the shared `ConditionsEditor`.
- **Builder Mode**: left palette (click or drag to add), center canvas with
  drag-and-drop reordering plus up/down buttons, right configuration panel, Save, and
  inline Preview.
- **Fill Mode**: real-time conditional visibility/required, real-time calculations,
  submit-time validation, and PDF download.
- **Template management**: searchable templates list, a Favourites view, and a per-card
  favourite toggle.
- **Persistence**: templates and submitted instances survive a full page refresh.
- **PDF export**: native print document; hidden fields are excluded; re-downloadable
  from the responses list.

---

## localStorage schema

Two versioned, top-level keys managed by Zustand's `persist` middleware:

```
formix:templates:v1   ->  { state: { templates: FormTemplate[] }, version: 2 }
formix:instances:v1   ->  { state: { instances: FormInstance[] }, version: 1 }
```

The `:v1` key suffix is stable; the inner `version` is what Zustand `migrate()` uses.
Templates are at **version 2** (migration backfills `favorite: false` on older records).
Instances remain at version 1.

```ts
interface FormTemplate {
  id: string
  title: string
  fields: AnyField[]      // discriminated union keyed on `type`
  favorite: boolean       // surfaced in the Favourites view (British spelling in routes/UI)
  createdAt: string       // ISO
  updatedAt: string       // ISO
}

interface FormInstance {
  id: string
  templateId: string                    // references a FormTemplate
  values: Record<string, FieldValue>    // only VISIBLE input fields at submit time
  submittedAt: string                   // ISO
}
```

### Why this shape

- **Templates and instances are stored separately.** Instances reference a template by
  `templateId`. This keeps each template document small, lets the response count be
  derived (`instances.filter(i => i.templateId === t.id).length`), and means editing a
  template never rewrites stored responses.
- **Versioned keys + `version` field.** Enables `persist` migrations for future schema
  changes without losing existing data after a refresh.
- **Fields are a discriminated union** (`AnyField`) keyed on `type`, so consumers switch
  exhaustively and the compiler enforces handling every field type.
- **Files are metadata only** (`{ name, size, type }`). File bytes are never persisted
  (localStorage is small and the spec forbids uploads); the PDF notes contents are not
  embedded.
- **Instances persist only visible input fields.** Hidden fields (per conditional logic)
  and display-only fields (Section Header) are excluded at submit time, so hidden data
  never enters storage or the PDF.

---

## Architecture & key decisions

### Field registry — adding an 11th field type

Every field type lives in `src/fields/<type>/definition.tsx` and implements a single
`FieldDefinition` contract (`src/fields/contract.ts`): palette metadata (including
`category` for palette grouping), `createDefault`, `ConfigPanel`, `Renderer`,
`getEmptyValue`, `validate`, `validateConfig` (builder-time config rules), `toPdf`, and
(for condition targets) `operators` + `evaluate`.

All UI surfaces — the Builder palette, the configuration panel, the Fill renderer,
validation, conditional-logic operators, and PDF serialization — read from
`src/fields/registry.ts`. **Adding a new field type means:** create one folder with
`definition.tsx`, extend the `FieldType` union in `types.ts`, and add one entry to
`fieldRegistry`. Shared shells (`ConfigPanel`, `ConditionsEditor`, `OptionsEditor`) are
unchanged.

```
fields/
  contract.ts      # FieldDefinition interface + defineField() authoring helper
  registry.ts      # the single map: FieldType -> FieldDefinition
  types.ts         # discriminated-union field + value types
  <type>/definition.tsx
```

### Conditional logic

Implemented as a pure resolver in `src/logic/conditions.ts`:

```ts
resolveFieldStates(fields, values): Record<fieldId, { visible, required }>
```

- **Multiple conditions (the AND/OR decision):** conditions are evaluated
  **independently and applied in declaration order; the last matching condition wins per
  dimension** (visibility and required are independent). A single AND/OR over the whole
  list cannot express conditions with *different* effects (e.g. "show when X" **and**
  "become required when Y"), so this ordered/override model was chosen as strictly more
  expressive and predictable.
- **Chained conditions** (A depends on B depends on C) are resolved by **iterating to a
  fixpoint** bounded by `fields.length + 2` iterations, so changes cascade and converge
  deterministically for normal forms.
- **Valid condition targets:** text, number, date, and select fields (those with
  `operators`). File Upload, Calculation, and Section Header cannot be targets.
- **Hidden targets contribute no value:** when a condition's target field is currently
  hidden, its value is treated as empty.
- **Hidden-but-required is safe:** a hidden field is forced to non-required, never
  validated, never submitted, and never exported.
- A field **cannot target itself** (enforced in the editor and defensively in the engine).

### Calculation

`src/logic/calculation.ts` aggregates the **visible** source Number fields
(sum / average / min / max), excludes hidden sources, ignores empty sources for averages,
shows `—` when nothing is computable, and rounds to the configured precision. Calculation
fields are always read-only and **cannot source another calculation field**. They
recompute synchronously via a memo in `FormRenderer`, so they update in real time.
Submitted instances may include calculation values, but Response view and PDF **recompute**
from stored source numbers.

### Validation

`src/logic/validation.ts` runs on submit: it skips hidden fields entirely, checks the
**computed** required state (not the raw toggle), then runs each field's per-type
`validate`. This is the correctness-critical path for "hidden required fields must not be
validated".

### Builder-time configuration validation

A template cannot be saved with an incompletely configured field. On **Save** (and on
**Preview submit**, which also persists), `src/logic/configValidation.ts` collects
problems across all fields and blocks the save when any exist: the first offending field
is auto-selected, its problems are listed inline in the configuration panel, and a banner
appears above the canvas. The generic "Label is required" rule lives in the collector
(Label is required for every field type per the spec); type-specific rules are delegated
to each field's `validateConfig`, so this stays inside the one-folder-per-field model.
Current rules: Calculation needs ≥1 Number source; Single/Multi Select need ≥1 labelled
option; Multi Select min ≤ max and max ≤ option count; Number/Date/text min ≤ max; File
Upload max files ≥ 1.

### PDF export

`src/pdf/printInstance.ts` builds a self-contained, styled HTML document (title,
submission timestamp, visible field labels + formatted values in form order), writes it
into a hidden `<iframe>`, and calls the browser's native `print()`. Visibility is
**re-resolved from the stored values** so conditionally hidden fields never appear, and
the same path powers re-download from the responses list. No third-party PDF libraries
are used.

### State & routing

Zustand stores (`store/templates.ts`, `store/instances.ts`) own all persisted data;
Builder Mode keeps an editable **draft** in local component state and commits on Save.
The Builder **Preview** tab tests the unsaved draft; **Fill Mode** (`/fill/...`) and
“New Response” from the home card always use the **last saved** template. The Builder
Responses tab warns when there are unsaved changes.

Routing uses the **Next.js App Router** (`app/`) with `next/navigation`. The `app/(main)`
route group shares a common chrome via `AppLayout`, and the routes are:

```
/                                    -> templates list
/favourites                          -> templates list, favourites only
/builder/[templateId]                -> Builder Mode ("new" creates a fresh template)
/fill/[templateId]                   -> Fill Mode
/templates/[templateId]/instances    -> submitted responses
```

Because all data lives in `localStorage`, the data-driven pages are wrapped in a
`ClientOnly` boundary so they render only after hydration; this avoids server/client
markup mismatches while keeping real, refresh-safe URLs.

---

## Documented decisions for under-specified cases

- The per-field **Required toggle is the field's `defaultRequired`**; conditions with
  `require` / `unrequire` override it. **Default visibility** is `visible` unless changed.
- **Multiple conditions:** ordered, last-match-wins per dimension (see above).
- **Hidden values** are excluded from validation, calculations, condition evaluation,
  submitted data, and PDF.
- **Single Select** empty = no option selected; `does not equal` is `true` when nothing
  is selected.
- **Numbers** are stored as entered; decimals apply on display, PDF, and calculation
  output (no blur-time clamping). The `is within range` operator is inclusive on both ends.
- **Dates** are stored as ISO `yyyy-mm-dd`; `prefillToday` sets the value when a new
  response is opened.
- **Section Header** captures no value and is excluded from submitted data, but its
  heading still renders in the PDF for grouping.
- **File Upload** stores metadata only; the PDF lists `name (size, type)` and notes that
  contents are not embedded. Empty `allowedTypes` in the builder means any file type is
  accepted at fill time.
- **Calculation keeps a Required toggle and conditional logic** like any other input,
  even though the spec lists neither for it: a calculation can legitimately be required
  (e.g. an order total that must compute) and conditionally shown. A required calculation
  that resolves to no value (no/empty sources) fails submit-time validation like any other
  empty required field. A visible but empty calculation shows “No answer” in PDF export.
- **Incomplete field config blocks Save** (rather than warning or saving silently) so a
  template is never persisted in a non-functional state; see "Builder-time configuration
  validation" above.
- **Editing a template that already has responses is allowed but warns.** A banner in
  Builder Mode flags that past responses may show stale or missing values, since instances
  store raw values keyed by field id and are not migrated. Versioning is noted below as a
  future improvement.
- **Submitted responses are read-only** — view or re-export PDF; submit again for a new instance.
- **Template delete** is on the home/favourites card (confirms, then deletes template and
  all its instances). Builder has no delete action.
- **Spelling:** persisted `favorite`; routes and UI use British `favourites`.
- **No localStorage recovery** — clearing browser storage or quota errors remove all
  templates and responses; there is no in-app backup (export/import is future work).

---

## What I'd improve with more time

- Undo/redo and field duplication in Builder Mode.
- Condition-builder warnings for cycles or contradictory effects.
- Export/import templates as JSON and template versioning so old instances stay valid
  when a template changes.
- Unit tests for the conditional-logic and calculation engines (they are pure and highly
  testable).
- Richer PDF layout (logo, multi-column, explicit page breaks) within native constraints.

---

## Project documents

- [`IMPLEMENTATION.md`](IMPLEMENTATION.md) — the full design document (authoritative for architecture and the §12 decision log).
- [`AI_USAGE_LOG.md`](AI_USAGE_LOG.md) — AI usage log (prompts, verification, corrections).
