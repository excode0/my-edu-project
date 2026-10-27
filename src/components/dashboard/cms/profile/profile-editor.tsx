"use client"

import { BookOpen, CalendarDays, ImagePlus, Tag } from "lucide-react"
import { CmsCollectionFieldInput } from "@/components/dashboard/cms/koleksi/field-input"
import { CmsMediaField } from "@/components/dashboard/cms/koleksi/media-field"
import { CmsSlugField } from "@/components/dashboard/cms/slug-field"
import { CmsNewsBodyEditor } from "@/components/dashboard/cms/news/body-editor"
import { resolveContentEditorFields } from "@/lib/cms/collection-fields"
import type { CollectionFieldSchema, ContentBinding } from "@/types/type-cms"
import type { CmsRecord } from "@/types/type-cms-api"
import type { RecordDraft } from "@/types/type-cms-ui"

export function CmsProfileEditor({
  feature,
  fields,
  media,
  draft,
  onDraftChange,
  canUploadMedia,
  onUploaded,
}: {
  feature: ContentBinding
  fields: CollectionFieldSchema[]
  media: CmsRecord[]
  draft: RecordDraft
  onDraftChange: (updater: (current: RecordDraft) => RecordDraft) => void
  canUploadMedia: boolean
  onUploaded: () => Promise<void>
}) {
  const { title: titleField, summary: summaryField, body: bodyField, category: categoryField, date: dateField, additional } = resolveContentEditorFields(feature, fields)
  const itemData = draft.itemData ?? {}
  const mediaFields = additional.filter((field) => field.fieldType === "media")
  const otherFields = additional.filter((field) => field.fieldType !== "media")
  const body = bodyField && typeof itemData[bodyField.key] === "string" ? itemData[bodyField.key] as string : ""

  function updateField(key: string, value: unknown) {
    onDraftChange((current) => ({ ...current, itemData: { ...(current.itemData ?? {}), [key]: value } }))
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <label className="block text-xs font-medium text-slate-700">
            {titleField?.label || "Nama"}{titleField?.required && <span className="ml-1 text-rose-600">*</span>}
            <input
              autoFocus
              required={titleField?.required ?? true}
              minLength={typeof titleField?.validation.min === "number" ? titleField.validation.min : undefined}
              maxLength={typeof titleField?.validation.max === "number" ? titleField.validation.max : 120}
              value={draft.title}
              onChange={(event) => onDraftChange((current) => ({ ...current, title: event.target.value }))}
              className="mt-1.5 h-12 w-full rounded-lg border border-slate-200 px-3 text-lg font-semibold text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              placeholder={`Isi ${(titleField?.label || "nama").toLocaleLowerCase("id")}`}
            />
            {titleField?.helpText && <span className="mt-1 block font-normal text-slate-500">{titleField.helpText}</span>}
          </label>
          {summaryField && (
            <label className="mt-4 block text-xs font-medium text-slate-700">
              {summaryField.label}{summaryField.required && <span className="ml-1 text-rose-600">*</span>}
              <textarea
                rows={5}
                required={summaryField.required}
                maxLength={typeof summaryField.validation.max === "number" ? summaryField.validation.max : undefined}
                value={draft.description}
                onChange={(event) => onDraftChange((current) => ({ ...current, description: event.target.value }))}
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                placeholder={`Tulis ${summaryField.label.toLocaleLowerCase("id")} untuk daftar dan halaman publik.`}
              />
              <span className="mt-1 flex justify-between gap-3 font-normal text-slate-500">
                <span>{summaryField.helpText}</span>
                {typeof summaryField.validation.max === "number" && <span>{draft.description.length}/{summaryField.validation.max}</span>}
              </span>
            </label>
          )}
        </section>

        {bodyField && (
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-2 flex items-center gap-2">
              <BookOpen className="size-4 text-violet-700" />
              <h3 className="text-xs font-semibold text-slate-800">{bodyField.label}{bodyField.required && <span className="ml-1 text-rose-600">*</span>}</h3>
            </div>
            <CmsNewsBodyEditor value={body} required={bodyField.required} media={media} canUploadMedia={canUploadMedia} onUploaded={onUploaded} onChange={(value) => updateField(bodyField.key, value)} />
            {bodyField.helpText && <p className="mt-2 text-[10px] text-slate-400">{bodyField.helpText}</p>}
          </section>
        )}
      </div>

      <aside className="space-y-4">
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-xs font-semibold text-slate-800">Publikasi</h3>
          <div className="mt-3">
            <CmsSlugField
              label={`Slug ${feature.key === "program" ? "program" : feature.key === "extracurricular" ? "ekstrakurikuler" : feature.key === "facility" ? "fasilitas" : "prestasi"}`}
              value={draft.slug}
              sourceValue={draft.title}
              sourceLabel={(titleField?.label || "nama").toLocaleLowerCase("id")}
              onChange={(slug) => onDraftChange((current) => ({ ...current, slug }))}
            />
          </div>
          {dateField && (
            <label className="mt-3 block text-xs font-medium text-slate-700">
              <span className="flex items-center gap-1.5"><CalendarDays className="size-3.5 text-slate-400" />{dateField.label}{dateField.required && <span className="text-rose-600">*</span>}</span>
              <div className="mt-1.5"><CmsCollectionFieldInput field={dateField} value={itemData[dateField.key]} onChange={(value) => updateField(dateField.key, value)} /></div>
            </label>
          )}
          <p className="mt-3 text-[10px] leading-relaxed text-slate-500">Status saat ini: <span className="font-semibold text-slate-700">{draft.status}</span>. Ubah status terbit dari daftar konten.</p>
        </section>

        {categoryField && (
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center gap-2"><Tag className="size-4 text-violet-700" /><h3 className="text-xs font-semibold text-slate-800">{categoryField.label}</h3>{categoryField.required && <span className="text-rose-600">*</span>}</div>
            <CmsCollectionFieldInput field={categoryField} value={itemData[categoryField.key]} onChange={(value) => updateField(categoryField.key, value)} />
            {categoryField.helpText && <p className="mt-2 text-[10px] text-slate-400">{categoryField.helpText}</p>}
          </section>
        )}

        {mediaFields.map((field) => (
          <section key={field.key} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center gap-2"><ImagePlus className="size-4 text-violet-700" /><h3 className="text-xs font-semibold text-slate-800">{field.label}</h3>{field.required && <span className="text-rose-600">*</span>}</div>
            <CmsMediaField field={field} value={itemData[field.key]} media={media} canUpload={canUploadMedia} uploadTitle={draft.title} onChange={(value) => updateField(field.key, value)} onUploaded={onUploaded} />
            {field.helpText && <p className="mt-2 text-[10px] text-slate-400">{field.helpText}</p>}
          </section>
        ))}

        {otherFields.map((field) => (
          <section key={field.key} className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="mb-2 text-xs font-semibold text-slate-800">{field.label}{field.required && <span className="ml-1 text-rose-600">*</span>}</h3>
            <CmsCollectionFieldInput field={field} value={itemData[field.key]} media={media} onChange={(value) => updateField(field.key, value)} />
            {field.helpText && <p className="mt-2 text-[10px] text-slate-400">{field.helpText}</p>}
          </section>
        ))}
      </aside>
    </div>
  )
}
