import { useEffect, useState } from 'react'
import { IconFile, IconTrash } from '../../components/icons'
import { Button, ConfigRow, TextInput } from '../../components/ui'
import { formatBytes } from '../../lib/format'
import { defineField } from '../contract'
import type { FileMeta, FileUploadField } from '../types'
import { asFileList } from '../value'

function normalizeExtension(ext: string): string {
  const trimmed = ext.trim().toLowerCase()
  if (!trimmed) return ''
  return trimmed.startsWith('.') ? trimmed : `.${trimmed}`
}

function parseAllowedTypes(raw: string): string[] {
  return raw
    .split(',')
    .map(normalizeExtension)
    .filter(Boolean)
}

function formatAllowedTypes(types: string[]): string {
  return types.join(', ')
}

export const fileUploadDefinition = defineField<FileUploadField>({
  type: 'fileUpload',
  paletteLabel: 'File Upload',
  paletteDescription: 'Attach one or more files',
  category: 'advanced',
  icon: <IconFile />,
  isInput: true,
  createDefault: (id) => ({
    id,
    type: 'fileUpload',
    label: 'Untitled file upload',
    defaultVisible: true,
    defaultRequired: false,
    conditions: [],
    config: { allowedTypes: [] },
  }),
  getEmptyValue: () => [],
  ConfigPanel: ({ field, onChange }) => {
    const set = (patch: Partial<FileUploadField['config']>) =>
      onChange({ ...field, config: { ...field.config, ...patch } })
    const [typesText, setTypesText] = useState(() =>
      formatAllowedTypes(field.config.allowedTypes),
    )

    useEffect(() => {
      setTypesText(formatAllowedTypes(field.config.allowedTypes))
      // Sync when selecting a different field, not on every config edit while typing.
      // eslint-disable-next-line react-hooks/exhaustive-deps -- field.id only
    }, [field.id])

    return (
      <>
        <ConfigRow
          label="Allowed file types"
          hint="Comma-separated extensions, e.g. .pdf, .jpg, .png"
        >
          <TextInput
            value={typesText}
            onChange={(e) => {
              setTypesText(e.target.value)
              set({ allowedTypes: parseAllowedTypes(e.target.value) })
            }}
            onBlur={() => {
              const parsed = parseAllowedTypes(typesText)
              set({ allowedTypes: parsed })
              setTypesText(formatAllowedTypes(parsed))
            }}
            placeholder=".pdf, .jpg, .png"
          />
        </ConfigRow>
        <ConfigRow label="Max number of files">
          <TextInput
            type="number"
            min={1}
            value={field.config.maxFiles ?? ''}
            onChange={(e) =>
              set({ maxFiles: e.target.value === '' ? undefined : Number(e.target.value) })
            }
          />
        </ConfigRow>
      </>
    )
  },
  Renderer: ({ field, value, onChange, disabled }) => {
    const files = asFileList(value)
    const { allowedTypes, maxFiles } = field.config

    const handleFiles = (fileList: FileList | null) => {
      if (!fileList) return
      const incoming: FileMeta[] = Array.from(fileList).map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
      }))
      let next = [...files, ...incoming]
      if (maxFiles !== undefined) next = next.slice(0, maxFiles)
      onChange(next)
    }

    const removeFile = (index: number) =>
      onChange(files.filter((_, i) => i !== index))

    return (
      <div className="space-y-2">
        <label
          className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-line bg-white px-4 py-6 text-center text-sm text-muted hover:border-brand/50 ${
            disabled ? 'pointer-events-none opacity-60' : ''
          }`}
        >
          <IconFile />
          <span>Click to choose file(s)</span>
          {allowedTypes.length > 0 ? (
            <span className="text-xs">Allowed: {allowedTypes.join(', ')}</span>
          ) : null}
          <input
            type="file"
            multiple={maxFiles !== 1}
            accept={allowedTypes.map(normalizeExtension).join(',') || undefined}
            disabled={disabled}
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files)
              e.target.value = ''
            }}
          />
        </label>
        {files.length > 0 ? (
          <ul className="space-y-1.5">
            {files.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center justify-between rounded-lg border border-line bg-white px-3 py-2 text-sm"
              >
                <span className="truncate text-ink">{file.name}</span>
                <span className="flex items-center gap-2 text-xs text-muted">
                  {formatBytes(file.size)}
                  {!disabled ? (
                    <Button
                      variant="ghost"
                      aria-label="Remove file"
                      onClick={() => removeFile(index)}
                    >
                      <IconTrash />
                    </Button>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    )
  },
  validate: (field, value) => {
    const files = asFileList(value)
    if (files.length === 0) return null
    const { allowedTypes, maxFiles } = field.config
    if (maxFiles !== undefined && files.length > maxFiles) {
      return `At most ${maxFiles} file(s) allowed`
    }
    if (allowedTypes.length > 0) {
      const normalized = allowedTypes.map(normalizeExtension)
      const invalid = files.find(
        (file) => !normalized.some((ext) => file.name.toLowerCase().endsWith(ext)),
      )
      if (invalid) return `"${invalid.name}" is not an allowed file type`
    }
    return null
  },
  validateConfig: (field) => {
    const { maxFiles } = field.config
    return maxFiles !== undefined && maxFiles < 1
      ? ['Max number of files must be at least 1.']
      : []
  },
  toPdf: (_field, value) => {
    const files = asFileList(value)
    if (files.length === 0) return ''
    return files
      .map((file) => `${file.name} (${formatBytes(file.size)}${file.type ? `, ${file.type}` : ''})`)
      .join('; ')
  },
})
