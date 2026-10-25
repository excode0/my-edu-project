import { CalendarDays, ImagePlus, Newspaper } from "lucide-react"
import { CmsCollectionFieldInput } from "@/components/dashboard/cms/koleksi/field-input"
import { resolveContentEditorFields } from "@/lib/cms/collection-fields"
import { CmsNewsBodyEditor } from "./body-editor"
import type { CollectionFieldSchema, ContentBinding } from "@/types/type-cms"
import type { CmsRecord } from "@/types/type-cms-api"
import type { RecordDraft } from "@/types/type-cms-ui"

export function CmsNewsEditor({
  feature,
  fields,
  media,
  draft,
  onDraftChange,
}: {
  feature: ContentBinding
  fields: CollectionFieldSchema[]
  media: CmsRecord[]
  draft: RecordDraft
  onDraftChange: (updater: (current: RecordDraft) => RecordDraft) => void
}) {
  const { title: titleField, summary: summaryField, body: bodyField, category: categoryField, date: dateField, additional: otherFields } = resolveContentEditorFields(feature, fields)
  const itemData = draft.itemData ?? {}

  function updateField(key: string, value: unknown) {
    onDraftChange((current) => ({ ...current, itemData: { ...(current.itemData ?? {}), [key]: value } }))
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4">
          <label className="block text-xs font-medium text-slate-700">
            {titleField?.label || "Judul berita"}{titleField?.required && <span className="ml-1 text-rose-600">*</span>}
            <input autoFocus required={titleField?.required ?? true} value={draft.title} onChange={(event) => onDraftChange((current) => ({ ...current, title: event.target.value }))} className="mt-1.5 h-12 w-full rounded-lg border border-slate-200 px-3 text-lg font-semibold text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100" placeholder="Tulis judul yang jelas dan menarik" />
          </label>
          <label className="block text-xs font-medium text-slate-700">
            {summaryField?.label || "Ringkasan"}{summaryField?.required && <span className="ml-1 text-rose-600">*</span>}
            <textarea rows={3} required={summaryField?.required} value={draft.description} onChange={(event) => onDraftChange((current) => ({ ...current, description: event.target.value }))} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm leading-6 outline-none placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100" placeholder="Ringkas inti berita untuk daftar dan pratinjau." />
          </label>
          {bodyField ? (
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-slate-700">
                <span>{bodyField.label}{bodyField.required && <span className="ml-1 text-rose-600">*</span>}</span>
                {bodyField.helpText && <span className="font-normal text-slate-400">{bodyField.helpText}</span>}
              </div>
              <CmsNewsBodyEditor value={typeof itemData[bodyField.key] === "string" ? itemData[bodyField.key] as string : ""} required={bodyField.required} onChange={(value) => updateField(bodyField.key, value)} />
            </div>
          ) : <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">Koleksi belum memiliki field isi berita yang ditetapkan oleh fitur.</div>}
        </div>

        <aside className="space-y-4">
          <section className="rounded-xl border border-slate-200 p-4">
            <div className="mb-3 flex items-center gap-2"><Newspaper className="size-4 text-violet-700" /><h3 className="text-xs font-semibold text-slate-800">Publikasi</h3></div>
            <label className="block text-xs font-medium text-slate-700">Slug berita<input value={draft.slug} onChange={(event) => onDraftChange((current) => ({ ...current, slug: event.target.value }))} className="mt-1.5 h-9 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-violet-400" placeholder="dibuat-dari-judul" /></label>
            {dateField && <label className="mt-3 block text-xs font-medium text-slate-700"><span className="flex items-center gap-1.5"><CalendarDays className="size-3.5 text-slate-400" />{dateField.label}{dateField.required && <span className="text-rose-600">*</span>}</span><div className="mt-1.5"><CmsCollectionFieldInput field={dateField} value={itemData[dateField.key]} onChange={(value) => updateField(dateField.key, value)} /></div></label>}
          </section>

          {categoryField && <section className="rounded-xl border border-slate-200 p-4"><h3 className="mb-3 text-xs font-semibold text-slate-800">Kategori</h3><CmsCollectionFieldInput field={categoryField} value={itemData[categoryField.key]} onChange={(value) => updateField(categoryField.key, value)} /><p className="mt-2 text-[10px] text-slate-400">Pilihan kategori mengikuti skema koleksi.</p></section>}

          {otherFields.map((field) => (
            <section key={field.key} className="rounded-xl border border-slate-200 p-4">
              <div className="mb-2 flex items-center gap-2">{field.fieldType === "media" ? <ImagePlus className="size-4 text-violet-700" /> : null}<h3 className="text-xs font-semibold text-slate-800">{field.label}</h3>{field.required && <span className="text-rose-600">*</span>}</div>
              <CmsCollectionFieldInput field={field} value={itemData[field.key]} media={media} onChange={(value) => updateField(field.key, value)} />
              {field.helpText && <p className="mt-2 text-[10px] text-slate-400">{field.helpText}</p>}
            </section>
          ))}
        </aside>
      </div>
    </div>
  )
}
