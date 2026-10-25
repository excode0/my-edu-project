import Image from "next/image"
import { inputClassName } from "@/components/dashboard/cms/presentation"
import { getCollectionFieldControl, getCollectionFieldInputValue, getCollectionFieldOptions, parseCollectionFieldInput, selectMediaRecord } from "./field-controls"
import type { CollectionFieldSchema } from "@/types/type-cms"
import type { CmsRecord } from "@/types/type-cms-api"

export function CmsCollectionFieldInput({
  field,
  value,
  media = [],
  onChange,
}: {
  field: CollectionFieldSchema
  value: unknown
  media?: CmsRecord[]
  onChange: (value: unknown) => void
}) {
  const control = getCollectionFieldControl(field)
  const options = getCollectionFieldOptions(field)
  const inputValue = getCollectionFieldInputValue(field, value)
  const commonProps = {
    id: `item-field-${field.key}`,
    required: field.required && field.fieldType !== "boolean" && field.fieldType !== "media_multiple",
    className: inputClassName(),
    "aria-describedby": field.helpText ? `item-help-${field.key}` : undefined,
  }

  if (control === "checkbox") {
    return <input {...commonProps} type="checkbox" checked={value === true || value === "true"} onChange={(event) => onChange(event.target.checked)} className="mt-2 size-4 accent-violet-700" />
  }
  if (control === "select") {
    return <select {...commonProps} value={inputValue as string} onChange={(event) => onChange(parseCollectionFieldInput(field, event.target.value))}><option value="">Pilih {field.label.toLocaleLowerCase("id")}</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select>
  }
  if (control === "multiselect") {
    return <select {...commonProps} multiple value={inputValue as string[]} onChange={(event) => onChange(parseCollectionFieldInput(field, Array.from(event.currentTarget.selectedOptions, (option) => option.value)))}>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select>
  }
  if (control === "media") {
    const selectedMedia = selectMediaRecord(media, value)
    return <div className="space-y-2"><select {...commonProps} value={inputValue as string} onChange={(event) => onChange(event.target.value)}><option value="">Pilih gambar dari pustaka media</option>{media.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select>{selectedMedia && <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-2"><span className="relative size-12 shrink-0 overflow-hidden rounded-md"><Image src={selectedMedia.slug} alt="" fill sizes="48px" className="object-cover" unoptimized /></span><span className="min-w-0 truncate text-xs text-slate-600">{selectedMedia.title}</span></div>}</div>
  }
  if (control === "media-multiple") {
    return <select {...commonProps} multiple value={inputValue as string[]} onChange={(event) => onChange(Array.from(event.currentTarget.selectedOptions, (option) => option.value))}>{media.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select>
  }
  if (control === "textarea") {
    const display = typeof value === "string" ? value : value == null ? "" : JSON.stringify(value, null, 2)
    return <textarea {...commonProps} rows={field.fieldType === "richtext" ? 10 : 4} value={display} onChange={(event) => onChange(event.target.value)} placeholder={field.fieldType === "json" ? "Masukkan JSON yang valid" : undefined} />
  }

  return <input {...commonProps} type={control} value={inputValue as string} onChange={(event) => onChange(parseCollectionFieldInput(field, event.target.value))} />
}
