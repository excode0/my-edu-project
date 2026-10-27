"use client"

import { useState } from "react"
import Image from "next/image"
import { inputClassName } from "@/components/dashboard/cms/presentation"
import { isCmsImageSource } from "@/lib/cms/richtext-policy"
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
  const [optionQuery, setOptionQuery] = useState("")
  const control = getCollectionFieldControl(field)
  const options = getCollectionFieldOptions(field)
  const inputValue = getCollectionFieldInputValue(field, value)
  const imageMedia = media.filter((item) => isCmsImageSource(item.slug))
  const describedBy = field.helpText ? `item-help-${field.key}` : undefined
  const commonProps = {
    id: `item-field-${field.key}`,
    required: field.required && field.fieldType !== "boolean" && field.fieldType !== "multiselect" && field.fieldType !== "media_multiple",
    className: inputClassName(),
    "aria-describedby": describedBy,
  }

  if (control === "checkbox") {
    return <input {...commonProps} type="checkbox" checked={value === true || value === "true"} onChange={(event) => onChange(event.target.checked)} className="mt-2 size-4 accent-violet-700" />
  }
  if (control === "select") {
    const filteredOptions = options.filter((option) => option.toLocaleLowerCase("id").includes(optionQuery.toLocaleLowerCase("id")))
    return <div className="space-y-1.5"><input type="search" value={optionQuery} onChange={(event) => setOptionQuery(event.target.value)} placeholder={`Cari ${field.label.toLocaleLowerCase("id")}...`} aria-label={`Cari pilihan ${field.label}`} className={inputClassName()} /><select {...commonProps} value={inputValue as string} onChange={(event) => onChange(parseCollectionFieldInput(field, event.target.value))}><option value="">Pilih {field.label.toLocaleLowerCase("id")}</option>{filteredOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select>{optionQuery && filteredOptions.length === 0 && <p className="text-[11px] font-normal text-slate-500">Tidak ada pilihan yang cocok.</p>}</div>
  }
  if (control === "multiselect") {
    const selected = new Set(inputValue as string[])
    const filteredOptions = options.filter((option) => option.toLocaleLowerCase("id").includes(optionQuery.toLocaleLowerCase("id")))
    return <div id={`item-field-${field.key}`} aria-describedby={describedBy} className="mt-1.5 space-y-1.5"><input type="search" value={optionQuery} onChange={(event) => setOptionQuery(event.target.value)} placeholder={`Cari ${field.label.toLocaleLowerCase("id")}...`} aria-label={`Cari pilihan ${field.label}`} className={inputClassName()} /><div role="group" className="grid max-h-64 gap-1.5 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2 sm:grid-cols-2">{filteredOptions.map((option) => <label key={option} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-normal text-slate-700 hover:bg-slate-50"><input type="checkbox" checked={selected.has(option)} onChange={(event) => {
      const next = new Set(selected)
      if (event.target.checked) next.add(option)
      else next.delete(option)
      onChange(Array.from(next))
    }} className="size-4 accent-violet-700" />{option}</label>)}{!filteredOptions.length && <p className="col-span-full px-2 py-3 text-center text-xs font-normal text-slate-500">Tidak ada pilihan yang cocok.</p>}</div></div>
  }
  if (control === "media") {
    const selectedMedia = selectMediaRecord(media, value)
    const filteredMedia = imageMedia.filter((item) => `${item.title} ${item.slug}`.toLocaleLowerCase("id").includes(optionQuery.toLocaleLowerCase("id")))
    return <div className="space-y-1.5"><input type="search" value={optionQuery} onChange={(event) => setOptionQuery(event.target.value)} placeholder="Cari media..." aria-label="Cari media" className={inputClassName()} /><select {...commonProps} value={inputValue as string} onChange={(event) => onChange(event.target.value)}><option value="">Pilih media dari pustaka</option>{filteredMedia.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select>{optionQuery && !filteredMedia.length && <p className="text-[11px] font-normal text-slate-500">Media tidak ditemukan.</p>}{selectedMedia && <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-2"><span className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-100 text-[9px] font-semibold uppercase text-slate-500">{isCmsImageSource(selectedMedia.slug) ? <Image src={selectedMedia.slug} alt="" fill sizes="48px" className="object-cover" unoptimized /> : selectedMedia.slug.split(".").pop()}</span><span className="min-w-0 truncate text-xs text-slate-600">{selectedMedia.title}</span></div>}</div>
  }
  if (control === "media-multiple") {
    const selected = new Set(inputValue as string[])
    const filteredMedia = imageMedia.filter((item) => `${item.title} ${item.slug}`.toLocaleLowerCase("id").includes(optionQuery.toLocaleLowerCase("id")))
    return <div id={`item-field-${field.key}`} aria-describedby={describedBy} className="mt-1.5 space-y-1.5"><input type="search" value={optionQuery} onChange={(event) => setOptionQuery(event.target.value)} placeholder="Cari media..." aria-label="Cari media" className={inputClassName()} /><div role="group" className="grid max-h-64 gap-1.5 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2 sm:grid-cols-2">{filteredMedia.map((item) => <label key={item.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-normal text-slate-700 hover:bg-slate-50"><input type="checkbox" checked={selected.has(item.id)} onChange={(event) => {
      const next = new Set(selected)
      if (event.target.checked) next.add(item.id)
      else next.delete(item.id)
      onChange(imageMedia.filter((candidate) => next.has(candidate.id)).map((candidate) => candidate.id))
    }} className="size-4 shrink-0 accent-violet-700" /><span className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded bg-slate-100"><Image src={item.slug} alt="" fill sizes="32px" className="object-cover" unoptimized /></span><span className="min-w-0 truncate">{item.title}</span></label>)}{!filteredMedia.length && <p className="col-span-full px-2 py-3 text-center text-xs font-normal text-slate-500">Media tidak ditemukan.</p>}</div></div>
  }
  if (control === "textarea") {
    const display = typeof value === "string" ? value : value == null ? "" : JSON.stringify(value, null, 2)
    return <textarea {...commonProps} rows={field.fieldType === "richtext" ? 10 : 4} value={display} onChange={(event) => onChange(event.target.value)} placeholder={field.fieldType === "json" ? "Masukkan JSON yang valid" : undefined} />
  }

  return <input {...commonProps} type={control} value={inputValue as string} onChange={(event) => onChange(parseCollectionFieldInput(field, event.target.value))} />
}
