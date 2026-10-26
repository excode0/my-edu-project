import { useState } from "react"
import { CalendarDays, Eye, ImagePlus, Newspaper, PencilLine } from "lucide-react"
import Image from "next/image"
import { CmsCollectionFieldInput } from "@/components/dashboard/cms/koleksi/field-input"
import { resolveContentEditorFields } from "@/lib/cms/collection-fields"
import { CmsNewsBodyEditor } from "./body-editor"
import { sanitizeCmsEditorHtml } from "./sanitize-editor-html"
import type { CollectionFieldSchema, ContentBinding } from "@/types/type-cms"
import type { CmsRecord } from "@/types/type-cms-api"
import type { RecordDraft } from "@/types/type-cms-ui"

export function CmsNewsEditor({
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
  const [preview, setPreview] = useState(false)
  const { title: titleField, summary: summaryField, body: bodyField, category: categoryField, date: dateField, additional: otherFields } = resolveContentEditorFields(feature, fields)
  const itemData = draft.itemData ?? {}
  const heroField = otherFields.find((field) => field.fieldType === "media")
  const heroMediaId = heroField ? itemData[heroField.key] : undefined
  const heroMedia = typeof heroMediaId === "string" ? media.find((item) => item.id === heroMediaId) : undefined
  const articleBody = bodyField && typeof itemData[bodyField.key] === "string" ? itemData[bodyField.key] as string : ""

  function updateField(key: string, value: unknown) {
    onDraftChange((current) => ({ ...current, itemData: { ...(current.itemData ?? {}), [key]: value } }))
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <div><p className="text-xs font-semibold text-slate-800">Editor berita</p><p className="mt-0.5 text-[10px] text-slate-500">Tulis konten atau lihat pratinjau artikel.</p></div>
        <button type="button" onClick={() => setPreview((current) => !current)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:border-violet-300 hover:text-violet-700">{preview ? <PencilLine className="size-4" /> : <Eye className="size-4" />}{preview ? "Kembali mengedit" : "Pratinjau"}</button>
      </div>
      {preview ? (
        <article className="mx-auto w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {heroMedia && <Image src={heroMedia.slug} alt={draft.title} width={1200} height={460} unoptimized className="max-h-[460px] w-full object-cover" />}
          <div className="p-6 sm:p-10">
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              {categoryField && typeof itemData[categoryField.key] === "string" && <span className="rounded-full bg-violet-50 px-3 py-1 font-semibold text-violet-700">{itemData[categoryField.key] as string}</span>}
              {dateField && typeof itemData[dateField.key] === "string" && <time>{itemData[dateField.key] as string}</time>}
            </div>
            <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-slate-950 sm:text-4xl">{draft.title || "Judul berita"}</h1>
            {draft.description && <p className="mt-4 border-b border-slate-100 pb-6 text-base leading-7 text-slate-600">{draft.description}</p>}
            {articleBody ? <div className="prose prose-slate mt-7 max-w-none [&_figure]:my-6 [&_figcaption]:mt-2 [&_figcaption]:text-center [&_figcaption]:text-xs [&_figcaption]:text-slate-500 [&_iframe]:aspect-video [&_iframe]:w-full [&_iframe]:rounded-lg [&_img]:mx-auto [&_img]:max-h-[560px] [&_img]:rounded-lg [&_img]:object-contain" dangerouslySetInnerHTML={{ __html: sanitizeCmsEditorHtml(articleBody) }} /> : <p className="mt-7 text-sm text-slate-400">Isi berita belum ditulis.</p>}
          </div>
        </article>
      ) : <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
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
              <CmsNewsBodyEditor value={articleBody} required={bodyField.required} media={media} canUploadMedia={canUploadMedia} onUploaded={onUploaded} onChange={(value) => updateField(bodyField.key, value)} />
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
      </div>}
    </div>
  )
}
