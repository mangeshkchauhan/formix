import { fieldRegistry } from '../fields/registry'
import type { FormInstance, FormTemplate } from '../fields/types'
import { headerLevel } from '../fields/sectionHeader/definition'
import { applyCalculations } from '../logic/calculation'
import { resolveFieldStates } from '../logic/conditions'
import { formatDateTime } from '../lib/format'

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Builds a self-contained printable HTML document for a submitted instance.
 * Visibility is re-resolved from the stored values so conditionally hidden fields
 * never appear in the export. Uses only browser-native APIs (no PDF libraries).
 */
export function buildInstanceHtml(
  template: FormTemplate,
  instance: FormInstance,
): string {
  const states = resolveFieldStates(template.fields, instance.values)
  const display = applyCalculations(template.fields, instance.values, states)

  const blocks: string[] = []
  let answered = 0

  for (const field of template.fields) {
    if (!states[field.id]?.visible) continue
    const definition = fieldRegistry[field.type]

    if (field.type === 'sectionHeader') {
      const level = headerLevel[field.config.size]
      blocks.push(
        `<h${level} class="section">${escapeHtml(field.label)}</h${level}>`,
      )
      continue
    }

    if (!definition.isInput) continue
    answered += 1

    const valueText = definition.toPdf(field, display[field.id] ?? null)
    const safeValue = valueText
      ? escapeHtml(valueText)
      : '<span class="empty">No answer</span>'
    const note =
      field.type === 'fileUpload' && valueText
        ? '<div class="note">File contents are not embedded in this export.</div>'
        : ''

    blocks.push(
      `<div class="row">
        <div class="label">${escapeHtml(field.label)}</div>
        <div class="value">${safeValue}</div>
        ${note}
      </div>`,
    )
  }

  const generatedAt = formatDateTime(new Date().toISOString())

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(template.title)} — Response</title>
<style>
  @page { margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, system-ui, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #0f172a;
    margin: 0;
    line-height: 1.55;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    background: #fff;
  }
  .doc { max-width: 720px; margin: 0 auto; padding: 32px; }
  .header {
    display: flex; align-items: center; gap: 12px;
    padding: 20px 24px;
    background: linear-gradient(135deg, #6d28d9, #8b5cf6);
    color: #fff; border-radius: 16px;
  }
  .logo {
    width: 40px; height: 40px; border-radius: 12px;
    background: rgba(255,255,255,0.18);
    display: flex; align-items: center; justify-content: center;
  }
  .brand { font-size: 13px; font-weight: 600; letter-spacing: .04em; opacity: .9; }
  .title { font-size: 22px; font-weight: 700; margin-top: 2px; }
  .summary {
    display: flex; gap: 28px;
    margin: 24px 4px 8px;
  }
  .stat .num { font-size: 20px; font-weight: 700; color: #0f172a; }
  .stat .cap { font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: #64748b; }
  .stat .small { font-size: 13px; font-weight: 600; color: #0f172a; }
  .fields { margin-top: 12px; border-top: 1px solid #e2e8f0; }
  .row { padding: 14px 4px; border-bottom: 1px solid #eef2f6; page-break-inside: avoid; }
  .label { font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: #64748b; margin-bottom: 3px; }
  .value { font-size: 15px; color: #0f172a; white-space: pre-wrap; word-break: break-word; }
  .empty { color: #94a3b8; font-style: italic; }
  .note { font-size: 11px; color: #94a3b8; margin-top: 4px; font-style: italic; }
  .section { margin: 26px 4px 6px; color: #4c1d95; }
  h2.section { font-size: 19px; } h3.section { font-size: 17px; }
  h4.section { font-size: 15px; } h5.section { font-size: 14px; }
  h6.section { font-size: 12px; text-transform: uppercase; letter-spacing: .05em; color: #64748b; }
  .footer {
    margin-top: 28px; padding-top: 12px; border-top: 1px solid #e2e8f0;
    display: flex; justify-content: space-between;
    font-size: 11px; color: #94a3b8;
  }
</style>
</head>
<body>
  <div class="doc">
    <div class="header">
      <div class="logo">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="3" width="16" height="18" rx="3" fill="#fff" opacity="0.3"/>
          <path d="M8 8h8M8 12h8M8 16h4" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
      <div>
        <div class="brand">FORMIX</div>
        <div class="title">${escapeHtml(template.title)}</div>
      </div>
    </div>

    <div class="summary">
      <div class="stat"><div class="num">${answered}</div><div class="cap">Fields</div></div>
      <div class="stat"><div class="small">${escapeHtml(formatDateTime(instance.submittedAt))}</div><div class="cap">Submitted</div></div>
    </div>

    <div class="fields">
      ${blocks.join('\n') || '<p class="empty" style="padding:16px 4px;">No responses recorded.</p>'}
    </div>

    <div class="footer">
      <span>Generated by Formix</span>
      <span>${escapeHtml(generatedAt)}</span>
    </div>
  </div>
</body>
</html>`
}

/** Renders the instance into a hidden iframe and opens the browser print dialog. */
export function printInstance(template: FormTemplate, instance: FormInstance): void {
  const html = buildInstanceHtml(template, instance)

  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'

  iframe.onload = () => {
    const frameWindow = iframe.contentWindow
    if (!frameWindow) return
    const cleanup = () => {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe)
    }
    frameWindow.onafterprint = cleanup
    frameWindow.focus()
    frameWindow.print()
    // Fallback cleanup in case onafterprint never fires.
    window.setTimeout(cleanup, 60000)
  }

  iframe.srcdoc = html
  document.body.appendChild(iframe)
}
