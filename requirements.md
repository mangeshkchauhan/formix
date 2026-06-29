# Form Builder — Frontend Take Home

**Confidential**

## Form Builder

### Frontend Take Home Assignment

---

## Time Estimate

Most candidates spend **6–8 hours**. There is no hard deadline on hours — submit when you're satisfied with the quality of the core features.

---

## What You're Building

A browser-based form builder — think Google Forms, but with the visual quality and interaction patterns of a modern SaaS product.

The application has two modes:

- **Builder Mode** — Design a form template by adding, configuring, and ordering fields
- **Fill Mode** — Create a new form instance from a template, fill it out, and export it as a PDF

All data is stored in **localStorage**. No backend, no server, no database required.

---

## The 10 Field Types

Implement the following field types. Each must be fully configurable in Builder Mode and correctly rendered in Fill Mode.

### 1. Single Line Text

A single-line text input.

| Configuration Option | Description |
| --- | --- |
| **Label** | (required) |
| **Placeholder text** | Hint shown inside the input when empty |
| **Required toggle** | Makes the field mandatory on submission |
| **Min / max character length** | Validates input length |
| **Prefix text** | Static text rendered before the input (e.g. `https://`) |
| **Suffix text** | Static text rendered after the input (e.g. `.com`) |

### 2. Multi-line Text

A multi-row textarea.

| Configuration Option | Description |
| --- | --- |
| **Label** | (required) |
| **Placeholder text** | Hint shown inside the textarea when empty |
| **Required toggle** | Makes the field mandatory on submission |
| **Min / max character length** | Validates input length |
| **Number of visible rows** | Controls the visible height of the textarea |

### 3. Number

A numeric input.

| Configuration Option | Description |
| --- | --- |
| **Label** | (required) |
| **Required toggle** | Makes the field mandatory on submission |
| **Min value / max value** | Validates numeric range |
| **Decimal places (0–4)** | Controls precision |
| **Prefix** | Static label before the input (e.g. `$`) |
| **Suffix** | Static label after the input (e.g. `kg`) |

### 4. Date

A date picker.

| Configuration Option | Description |
| --- | --- |
| **Label** | (required) |
| **Required toggle** | Makes the field mandatory on submission |
| **Pre-fill with today's date** | When enabled, automatically sets the field to today's date when a new form instance is opened |
| **Min date / max date** | Restricts selectable date range |

### 5. Single Select

Let the user pick one option from a list.

| Configuration Option | Description |
| --- | --- |
| **Label** | (required) |
| **Required toggle** | Makes the field mandatory on submission |
| **Options list** | Add, remove, and reorder options |
| **Display type: Radio** | Stacked list of labelled radio inputs |
| **Display type: Dropdown** | A select input that opens a list |
| **Display type: Tiles** | Horizontally laid out clickable option cards |

All three display types must be implemented. The selected option and required validation must behave identically across all three.

### 6. Multi Select

Let the user pick multiple options from a list.

| Configuration Option | Description |
| --- | --- |
| **Label** | (required) |
| **Required toggle** | Makes the field mandatory on submission |
| **Options list** | Add, remove, and reorder options |
| **Min selections / max selections** | Validates selection count |

### 7. File Upload

Let the user attach one or more files.

| Configuration Option | Description |
| --- | --- |
| **Label** | (required) |
| **Required toggle** | Makes the field mandatory on submission |
| **Allowed file types** | Comma-separated (e.g. `.pdf`, `.jpg`, `.png`) |
| **Max number of files** | Limits how many files can be attached |

> **Note:** Files are stored as metadata only (filename, size, type) — no upload to a server. The PDF export should handle the fact that file contents cannot be embedded.

### 8. Section Header

A non-input display element for visually grouping and labelling sections of a form. It does not capture any value from the user.

| Configuration Option | Description |
| --- | --- |
| **Label text** | The heading text to display |
| **Size: XS / Small / Medium / Large / XL** | Each size maps to a different visual weight and heading level |

### 9. Conditional Logic

Any field can have one or more conditions that control its visibility or required state based on the value of another field.

#### Condition Structure

- **Target field** — The field whose value is evaluated
- **Operator** — Depends on the target field's type (see table below)
- **Value** — The value to compare against
- **Effect** — One of: Show this field / Hide this field / Mark as required / Mark as not required

#### Operators by Field Type

| Target Field Type | Available Operators |
| --- | --- |
| Single Line Text, Multi-line Text | equals, does not equal, contains |
| Number | equals, is greater than, is less than, is within range |
| Single Select | equals, does not equal |
| Multi Select | contains any of, contains all of, contains none of |
| Date | equals, is before, is after |

#### Default State

Each field also has a default state (when no condition is active or when the target field has no value):

- **Default visibility:** visible or hidden
- **Default required:** required or not required

#### Rules to Enforce

- A hidden field must **never** be validated as required, even if it is marked required
- A hidden field's value must **not** appear in the submitted data or in the PDF export
- A field cannot set a condition on itself
- If a field has multiple conditions, document your AND / OR decision in the README

### 10. Calculation

A read-only field whose value is automatically computed from other Number fields in the form.

#### Configuration Options

- **Label** — (required)
- **Source fields** — One or more Number fields in this form
- **Aggregation type:** Sum, Average, Minimum, Maximum
- **Decimal places** — Controls precision of the result

#### Behaviour

- The calculated value must update in real-time as the user fills in the source Number fields
- The field is always read-only in Fill Mode — the user cannot type into it
- A Calculation field may not use another Calculation field as a source

---

## Application Structure

### Templates List (Home)

- Shows all saved form templates
- **"New Template"** button — opens Builder Mode with a blank form

Each template card shows:

- Title
- Number of fields
- Number of filled instances
- Last modified date

Actions:

- Click a template — opens it in Builder Mode (edit)
- **"New Response"** button on each card — creates a fresh instance and opens it in Fill Mode

### Builder Mode

- **Left panel** — Available field types; click or drag to add to the canvas
- **Center canvas** — The ordered list of fields in the form; support reordering (drag-and-drop preferred; up/down buttons acceptable)
- **Right panel** — Configuration panel for the currently selected field
- **Save button** — Persists the template to localStorage
- **Preview button** — Opens Fill Mode inline or in a modal so you can test the form

### Fill Mode

- Renders all fields according to their config
- Conditional fields show and hide in real-time as the user fills values
- Calculation fields update in real-time
- Required fields are validated on submit — hidden required fields are not validated
- **Submit** — Saves the filled instance to localStorage
- **Download PDF** — Exports the filled form (field labels + values) as a PDF

### Filled Instances List

- Accessible from a template's detail view or as a separate section
- Shows all submitted instances for a given template

Each entry:

- Submission timestamp
- Re-download PDF button

### PDF Export

The PDF export must use **browser-native APIs only**. Do not use any third-party PDF generation libraries.

The exported PDF must include:

- The form title
- All visible field labels and their submitted values
- Submission timestamp
- Fields in form order
- Hidden fields (due to conditional logic) must not appear in the export

---

## Technical Requirements

| Requirement | Details |
| --- | --- |
| **React + TypeScript** | Strong typing is expected; avoid `any` |
| **No backend** | Everything in localStorage |
| **No third-party PDF libraries** | Browser-native APIs only |
| **Styling** | No specific component library required — Tailwind, CSS Modules, plain CSS — your choice |
| **State management** | No specific library required — use what you judge is appropriate |
| **Page refresh** | The app must work correctly after a full page refresh |

---

## What to Submit

### 1. GitHub Repository

Public or shared with us. Must include:

- Full source code
- **README.md** covering:
  - How to run the project locally
  - Your localStorage schema and the reasoning behind it
  - Key architectural decisions and trade-offs (especially around conditional logic and component structure)
  - What you would improve with more time

### 2. AI Usage Log

A `.md` file in the repository covering:

- Every significant prompt you sent to an AI tool
- What you verified before using the AI output
- Any AI output you rejected or significantly changed — and why
- At least one example where the AI produced something plausible but incorrect

> We are not looking for a long log — quality over volume. **5 well-described prompts beat 20 one-liners.**

---

## Evaluation Criteria

| Criterion | What We're Looking For |
| --- | --- |
| **Product thinking** | Sensible decisions for under-specified cases? Documented? |
| **Component design** | Can someone add an 11th field type without editing 6 existing files? |
| **Conditional logic correctness** | Handles chained conditions, hidden-but-required fields, and real-time updates correctly? |
| **Type safety** | Do TypeScript types communicate the design, or are they decorative? |
| **PDF export quality** | Does the output look like a real export, or a debug dump? |

---

## We Are Not Looking For

- Pixel-perfect design
- 100% feature completeness
- A production-ready, deployable application

**Correctness and judgment over completeness.**

---

## Questions

For anything genuinely ambiguous and not covered by this spec — **do not ask us**. Make a decision, document it in your README, and explain your reasoning. That decision-making process is part of what we're evaluating.
