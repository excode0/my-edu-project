"use client"

import { useState } from "react"
import { ArrowDown, ArrowUp, ChevronDown, Plus, Trash2, Wand2 } from "lucide-react"
import { inputClassName } from "@/components/dashboard/cms/presentation"
import {
  collectionFieldKeyFromLabel,
  collectionFieldTypeOptions,
  getCollectionFieldTypeDefinition,
  normalizeCollectionFieldKeyInput,
  validateCollectionFieldKey,
} from "@/lib/cms/collection-field-types"
import { getCollectionFieldIssues } from "./collection-field-validation"
import type { CollectionFieldSchema } from "@/types/type-cms"

function createFieldId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID()
  return `field-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function uniqueFieldKey(fields: CollectionFieldSchema[], index: number, baseKey: string) {
  const used = new Set(fields.filter((_, fieldIndex) => fieldIndex !== index).map((field) => field.key))
  let key = baseKey
  let suffix = 2
  while (used.has(key)) {
    key = `${baseKey}_${suffix}`.slice(0, 80)
    suffix += 1
  }
  return key
}

function createEmptyField(fields: CollectionFieldSchema[]): CollectionFieldSchema {
  return {
    id: createFieldId(),
    key: uniqueFieldKey(fields, fields.length, "new_field"),
    label: "Field baru",
    fieldType: "text",
    required: false,
    isUnique: false,
    isListed: true,
    isSearchable: false,
    isFilterable: false,
    options: null,
    defaultValue: null,
    helpText: "",
    validation: {},
  }
}

function FieldOptionsEditor({
  field,
  onChange,
}: {
  field: CollectionFieldSchema
  onChange: (value: string[]) => void
}) {
  const [text, setText] = useState(() => Array.isArray(field.options) ? field.options.map(String).join("\n") : "")
  const options = text.split(/[|,\n]/).map((option) => option.trim()).filter(Boolean)
  const normalizedOptions = options.map((option) => option.toLocaleLowerCase("en"))
  const hasDuplicates = new Set(normalizedOptions).size !== normalizedOptions.length
  const tooMany = options.length > 50
  const hasError = hasDuplicates || tooMany

  return (
    <label className="mt-3 block text-xs font-medium text-slate-700">
      Options
      <textarea
        rows={3}
        required
        value={text}
        onChange={(event) => {
          const next = event.target.value
          setText(next)
          onChange(next.split(/[|,\n]/).map((option) => option.trim()).filter(Boolean))
        }}
        placeholder={"active\ninactive\npending"}
        className={inputClassName()}
      />
      <span className={`mt-1 block text-[11px] font-normal leading-relaxed ${hasError ? "text-rose-700" : "text-slate-500"}`}>
        {hasDuplicates
          ? "Options tidak boleh memiliki pilihan yang sama."
          : tooMany
            ? "Options maksimal 50 pilihan."
            : options.length
              ? `${options.length} options`
              : "Minimal satu option. Tulis satu pilihan per baris atau pisahkan dengan koma."}
      </span>
    </label>
  )
}

function DefaultValueInput({
  field,
  onChange,
}: {
  field: CollectionFieldSchema
  onChange: (value: unknown) => void
}) {
  if (field.fieldType === "boolean") {
    return <input type="checkbox" checked={field.defaultValue === true} onChange={(event) => onChange(event.target.checked)} className="mt-2 size-4 accent-violet-700" />
  }
  if (field.fieldType === "select") {
    const options = Array.isArray(field.options) ? field.options.map(String) : []
    return <select value={typeof field.defaultValue === "string" ? field.defaultValue : ""} onChange={(event) => onChange(event.target.value || null)} className={inputClassName()}><option value="">Tanpa default</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select>
  }
  const value = field.defaultValue == null ? "" : String(field.defaultValue)
  const inputType = field.fieldType === "number"
    ? "number"
    : field.fieldType === "date"
      ? "date"
      : field.fieldType === "datetime"
        ? "datetime-local"
        : field.fieldType === "email"
          ? "email"
          : field.fieldType === "url"
            ? "url"
            : field.fieldType === "phone"
              ? "tel"
              : "text"
  return <input
    type={inputType}
    step={field.fieldType === "number" ? "any" : undefined}
    value={value}
    onChange={(event) => {
      const next = event.target.value
      if (!next) {
        onChange(null)
      } else if (field.fieldType === "number") {
        const numeric = Number(next)
        onChange(Number.isFinite(numeric) ? numeric : next)
      } else {
        onChange(next)
      }
    }}
    placeholder="Kosongkan jika tidak ada"
    className={inputClassName()}
  />
}

export function CollectionFieldBuilder({
  fields,
  onChange,
}: {
  fields: CollectionFieldSchema[]
  onChange: (fields: CollectionFieldSchema[]) => void
}) {
  function updateField(index: number, patch: Partial<CollectionFieldSchema>) {
    onChange(fields.map((field, fieldIndex) => fieldIndex === index ? { ...field, ...patch } : field))
  }

  function moveField(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= fields.length) return
    const next = [...fields]
    const [field] = next.splice(index, 1)
    if (!field) return
    next.splice(target, 0, field)
    onChange(next)
  }

  function generateKey(index: number) {
    const field = fields[index]
    if (!field) return
    const baseKey = collectionFieldKeyFromLabel(field.label)
    updateField(index, { key: uniqueFieldKey(fields, index, baseKey) })
  }

  function updateValidation(index: number, key: "min" | "max", rawValue: string) {
    const field = fields[index]
    if (!field) return
    const validation = { ...field.validation }
    if (rawValue === "") {
      delete validation[key]
    } else {
      const numeric = Number(rawValue)
      if (!Number.isFinite(numeric)) return
      validation[key] = numeric
    }
    updateField(index, { validation })
  }

  return (
    <section className="text-xs font-medium text-slate-700 md:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-800">Struktur field koleksi</p>
          <p className="mt-1 text-[11px] font-normal leading-relaxed text-slate-500">Atur Field label untuk pengguna, lalu Field key dan Data type dengan istilah teknis internasional agar konsisten.</p>
        </div>
        <button type="button" onClick={() => onChange([...fields, createEmptyField(fields)])} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-violet-200 bg-white px-2.5 font-semibold text-violet-700 hover:bg-violet-50"><Plus className="size-3.5" /> Tambah field</button>
      </div>

      <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2.5 text-[11px] font-normal leading-relaxed text-sky-900">
        <span className="font-semibold">Global naming convention:</span> gunakan English snake_case untuk <code className="font-mono font-semibold">Field key</code>, misalnya <code className="font-mono">full_name</code>, <code className="font-mono">birth_date</code>, atau <code className="font-mono">phone_number</code>. <code className="font-mono font-semibold">Data type</code> memakai token internasional seperti <code className="font-mono">text</code>, <code className="font-mono">select</code>, atau <code className="font-mono">media_multiple</code>. Field label tetap boleh Bahasa Indonesia.
      </div>

      <div className="mt-3 space-y-3">
        {fields.map((field, index) => {
          const definition = getCollectionFieldTypeDefinition(field.fieldType)
          const supportsOptions = definition?.supportsOptions === true
          const supportsUnique = definition?.supportsUnique === true
          const supportsLength = definition?.supportsLength === true
          const supportsRange = definition?.supportsRange === true
          const supportsDefault = definition?.supportsDefault === true
          const validation = field.validation ?? {}
          const issues = getCollectionFieldIssues(field, fields)
          const keyError = validateCollectionFieldKey(field.key)
          return (
            <article key={field.id ?? `${field.key}-${index}`} className={`rounded-xl border bg-white p-3 shadow-sm ${issues.length ? "border-rose-200" : "border-slate-200"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-600">Field {index + 1}</p>
                    <code className="rounded bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">{field.fieldType}</code>
                  </div>
                  <p className="mt-1 truncate text-xs font-semibold text-slate-800">{field.label || "Tanpa label"} <code className="font-mono text-[10px] font-normal text-slate-400">{field.key}</code></p>
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  <button type="button" aria-label={`Naikkan ${field.label}`} title="Naikkan" disabled={index === 0} onClick={() => moveField(index, -1)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30"><ArrowUp className="size-3.5" /></button>
                  <button type="button" aria-label={`Turunkan ${field.label}`} title="Turunkan" disabled={index === fields.length - 1} onClick={() => moveField(index, 1)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30"><ArrowDown className="size-3.5" /></button>
                  <button type="button" aria-label={`Hapus field ${field.label}`} title="Hapus field" onClick={() => onChange(fields.filter((_, fieldIndex) => fieldIndex !== index))} className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-700"><Trash2 className="size-3.5" /></button>
                </div>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-medium text-slate-700">
                  Field label
                  <input required maxLength={120} value={field.label} onChange={(event) => updateField(index, { label: event.target.value })} className={inputClassName()} />
                  <span className="mt-1 block text-[10px] font-normal text-slate-400">Label yang dilihat pengguna. Boleh Bahasa Indonesia.</span>
                </label>
                <label className="text-xs font-medium text-slate-700">
                  Field key
                  <div className="flex gap-1.5">
                    <input
                      required
                      maxLength={80}
                      pattern="[a-z][a-z0-9_]*"
                      spellCheck={false}
                      value={field.key}
                      onChange={(event) => updateField(index, { key: normalizeCollectionFieldKeyInput(event.target.value) })}
                      onBlur={() => updateField(index, { key: field.key.replace(/_+$/, "") })}
                      aria-invalid={Boolean(keyError)}
                      className={`${inputClassName()} font-mono ${keyError ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100" : ""}`}
                    />
                    <button type="button" onClick={() => generateKey(index)} title="Generate key dari Field label" className="mt-1.5 inline-flex h-[42px] shrink-0 items-center gap-1.5 rounded-lg border border-violet-200 bg-white px-2.5 text-[11px] font-semibold text-violet-700 hover:bg-violet-50"><Wand2 className="size-3.5" /> Generate</button>
                  </div>
                  <span className="mt-1 block text-[10px] font-normal text-slate-400">English snake_case, unik, huruf kecil. Contoh: <code className="font-mono">full_name</code>, <code className="font-mono">birth_date</code>.</span>
                </label>
                <label className="text-xs font-medium text-slate-700">
                  Data type
                  <select value={field.fieldType} onChange={(event) => {
                    const fieldType = event.target.value
                    const nextDefinition = getCollectionFieldTypeDefinition(fieldType)
                    updateField(index, {
                      fieldType,
                      options: nextDefinition?.supportsOptions ? (Array.isArray(field.options) ? field.options : []) : null,
                      defaultValue: null,
                      isUnique: nextDefinition?.supportsUnique ? field.isUnique : false,
                      validation: {},
                    })
                  }} className={inputClassName()}>
                    {collectionFieldTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.value} — {option.label}</option>)}
                  </select>
                  <span className="mt-1 block text-[10px] font-normal leading-relaxed text-slate-400">{definition?.description ?? "Tipe data tidak dikenal."}</span>
                </label>
                <div className="flex flex-wrap items-center gap-4 pt-5">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700"><input type="checkbox" checked={field.required} onChange={(event) => updateField(index, { required: event.target.checked })} className="size-4 accent-violet-700" />Required <span className="font-normal text-slate-400">(wajib)</span></label>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700"><input type="checkbox" checked={field.isListed !== false} onChange={(event) => updateField(index, { isListed: event.target.checked })} className="size-4 accent-violet-700" />Admin list <span className="font-normal text-slate-400">(ringkasan)</span></label>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700"><input type="checkbox" checked={field.isSearchable === true} onChange={(event) => updateField(index, { isSearchable: event.target.checked })} className="size-4 accent-violet-700" />Searchable <span className="font-normal text-slate-400">(ikut pencarian)</span></label>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700"><input type="checkbox" checked={field.isFilterable === true} onChange={(event) => updateField(index, { isFilterable: event.target.checked })} className="size-4 accent-violet-700" />Filterable <span className="font-normal text-slate-400">(tersedia sebagai filter)</span></label>
                </div>
              </div>

              {supportsOptions && <FieldOptionsEditor field={field} onChange={(options) => {
                const defaultValue = field.fieldType === "select" && typeof field.defaultValue === "string" && !options.includes(field.defaultValue)
                  ? null
                  : field.defaultValue
                updateField(index, { options, defaultValue })
              }} />}

              <label className="mt-3 block text-xs font-medium text-slate-700">Help text<input value={field.helpText ?? ""} maxLength={2_000} onChange={(event) => updateField(index, { helpText: event.target.value })} placeholder="Petunjuk singkat untuk pengisi konten" className={inputClassName()} /></label>

              <details className="group mt-3 rounded-lg border border-slate-100 bg-slate-50/70">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-[11px] font-semibold text-slate-600"><span>Advanced settings</span><ChevronDown className="size-3.5 transition group-open:rotate-180" /></summary>
                <div className="grid gap-3 border-t border-slate-100 px-3 py-3 sm:grid-cols-2">
                  {supportsUnique && <label className="flex items-center gap-2 text-xs font-medium text-slate-700"><input type="checkbox" checked={field.isUnique === true} onChange={(event) => updateField(index, { isUnique: event.target.checked })} className="size-4 accent-violet-700" />Unique value <span className="font-normal text-slate-400">(harus unik)</span></label>}
                  {supportsDefault && <label className="text-xs font-medium text-slate-700">Default value<div className="mt-1.5"><DefaultValueInput field={field} onChange={(defaultValue) => updateField(index, { defaultValue })} /></div></label>}
                  {supportsLength && <label className="text-xs font-medium text-slate-700">Min length<input type="number" min={0} step={1} value={typeof validation.min === "number" ? validation.min : ""} onChange={(event) => updateValidation(index, "min", event.target.value)} className={inputClassName()} /></label>}
                  {supportsLength && <label className="text-xs font-medium text-slate-700">Max length<input type="number" min={0} step={1} value={typeof validation.max === "number" ? validation.max : ""} onChange={(event) => updateValidation(index, "max", event.target.value)} className={inputClassName()} /></label>}
                  {supportsRange && <label className="text-xs font-medium text-slate-700">Min value<input type="number" step="any" value={typeof validation.min === "number" ? validation.min : ""} onChange={(event) => updateValidation(index, "min", event.target.value)} className={inputClassName()} /></label>}
                  {supportsRange && <label className="text-xs font-medium text-slate-700">Max value<input type="number" step="any" value={typeof validation.max === "number" ? validation.max : ""} onChange={(event) => updateValidation(index, "max", event.target.value)} className={inputClassName()} /></label>}
                </div>
              </details>

              {issues.length > 0 && (
                <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-normal leading-relaxed text-rose-800" role="alert">
                  <p className="font-semibold">Validation</p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-4">
                    {issues.map((issue, issueIndex) => <li key={`${issue}-${issueIndex}`}>{issue}</li>)}
                  </ul>
                </div>
              )}
            </article>
          )
        })}
        {!fields.length && (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center">
            <p className="text-xs font-semibold text-slate-700">Belum ada field</p>
            <p className="mx-auto mt-1 max-w-md text-[11px] font-normal leading-relaxed text-slate-500">Koleksi tanpa field tetap bisa dibuat, tetapi item tidak akan memiliki input tambahan. Tambahkan field sesuai kebutuhan konten.</p>
            <button type="button" onClick={() => onChange([createEmptyField(fields)])} className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg bg-violet-700 px-3 text-[11px] font-semibold text-white hover:bg-violet-800"><Plus className="size-3.5" /> Tambah field pertama</button>
          </div>
        )}
      </div>
    </section>
  )
}
