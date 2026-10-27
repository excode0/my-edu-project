"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { BriefcaseBusiness, IdCard, ImagePlus, Loader2, UploadCloud, UserRound } from "lucide-react"
import { CmsCollectionFieldInput } from "@/components/dashboard/cms/koleksi/field-input"
import { selectMediaRecord } from "@/components/dashboard/cms/koleksi/field-controls"
import { CmsSlugField } from "@/components/dashboard/cms/slug-field"
import { uploadCmsMedia } from "@/lib/cms/client/media-api"
import { resolveContentEditorFields } from "@/lib/cms/collection-fields"
import { isCmsImageSource } from "@/lib/cms/richtext-policy"
import type { CollectionFieldSchema, ContentBinding } from "@/types/type-cms"
import type { CmsRecord } from "@/types/type-cms-api"
import type { RecordDraft } from "@/types/type-cms-ui"

function staffInitials(name: string) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase("id")
  return initials || "ST"
}

export function CmsStaffEditor({
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [uploadNotice, setUploadNotice] = useState("")
  const { title: titleField, summary: summaryField, additional } = resolveContentEditorFields(feature, fields)
  const itemData = draft.itemData ?? {}
  const nipField = additional.find((field) => field.key === "nip")
  const positionField = additional.find((field) => field.key === "position")
  const photoField = additional.find((field) => field.key === "photo" && field.fieldType === "media")
  const otherFields = additional.filter((field) => ![nipField?.key, positionField?.key, photoField?.key].includes(field.key))
  const photoMedia = photoField ? selectMediaRecord(media, itemData[photoField.key]) : undefined
  const showPhoto = Boolean(photoMedia && isCmsImageSource(photoMedia.slug))

  function updateField(key: string, value: unknown) {
    onDraftChange((current) => ({ ...current, itemData: { ...(current.itemData ?? {}), [key]: value } }))
  }

  async function uploadPhoto(file: File) {
    if (!photoField) return
    if (!file.type.startsWith("image/")) {
      setUploadError("File harus berupa gambar PNG, JPG, WebP, atau GIF.")
      return
    }
    setUploading(true)
    setUploadError("")
    setUploadNotice("")
    try {
      const form = new FormData()
      form.set("file", file)
      form.set("title", draft.title.trim() || file.name)
      if (draft.title.trim()) form.set("altText", draft.title.trim())
      const uploaded = await uploadCmsMedia(form)
      updateField(photoField.key, uploaded.id)
      await onUploaded()
      setUploadNotice("Foto berhasil diunggah, disimpan ke Media, dan dipilih otomatis.")
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Foto tidak dapat diunggah.")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <UserRound className="size-4 text-violet-700" />
            <h3 className="text-xs font-semibold text-slate-800">Identitas staf</h3>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-[112px_minmax(0,1fr)]">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
              {showPhoto && photoMedia ? (
                <Image src={photoMedia.slug} alt={draft.title || "Foto staf"} fill sizes="112px" unoptimized className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-violet-50 to-slate-100 text-2xl font-semibold text-violet-700">
                  {staffInitials(draft.title)}
                </div>
              )}
            </div>
            <div className="space-y-3">
              <label className="block text-xs font-medium text-slate-700">
                {titleField?.label || "Nama lengkap"}{titleField?.required && <span className="ml-1 text-rose-600">*</span>}
                <input
                  autoFocus
                  required={titleField?.required ?? true}
                  minLength={typeof titleField?.validation.min === "number" ? titleField.validation.min : undefined}
                  maxLength={typeof titleField?.validation.max === "number" ? titleField.validation.max : 120}
                  value={draft.title}
                  onChange={(event) => onDraftChange((current) => ({ ...current, title: event.target.value }))}
                  className="mt-1.5 h-11 w-full rounded-lg border border-slate-200 px-3 text-base font-semibold text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  placeholder="Nama lengkap beserta gelar"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                {nipField && (
                  <label className="block text-xs font-medium text-slate-700">
                    <span className="flex items-center gap-1.5"><IdCard className="size-3.5 text-slate-400" />{nipField.label}{nipField.required && <span className="text-rose-600">*</span>}</span>
                    <CmsCollectionFieldInput field={nipField} value={itemData[nipField.key]} onChange={(value) => updateField(nipField.key, value)} />
                    {nipField.helpText && <span className="mt-1 block font-normal text-slate-500">{nipField.helpText}</span>}
                  </label>
                )}
                {positionField && (
                  <label className="block text-xs font-medium text-slate-700">
                    <span className="flex items-center gap-1.5"><BriefcaseBusiness className="size-3.5 text-slate-400" />{positionField.label}{positionField.required && <span className="text-rose-600">*</span>}</span>
                    <CmsCollectionFieldInput field={positionField} value={itemData[positionField.key]} onChange={(value) => updateField(positionField.key, value)} />
                    {positionField.helpText && <span className="mt-1 block font-normal text-slate-500">{positionField.helpText}</span>}
                  </label>
                )}
              </div>
            </div>
          </div>
        </section>

        <label className="block rounded-xl border border-slate-200 bg-white p-4 text-xs font-medium text-slate-700">
          {summaryField?.label || "Biografi"}{summaryField?.required && <span className="ml-1 text-rose-600">*</span>}
          <textarea
            rows={7}
            required={summaryField?.required}
            maxLength={typeof summaryField?.validation.max === "number" ? summaryField.validation.max : undefined}
            value={draft.description}
            onChange={(event) => onDraftChange((current) => ({ ...current, description: event.target.value }))}
            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            placeholder="Tulis profil singkat, pendidikan, atau bidang keahlian."
          />
          {summaryField?.helpText && <span className="mt-1 block font-normal text-slate-500">{summaryField.helpText}</span>}
        </label>
      </div>

      <aside className="space-y-4">
        {photoField && (
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center gap-2"><ImagePlus className="size-4 text-violet-700" /><h3 className="text-xs font-semibold text-slate-800">{photoField.label}</h3>{photoField.required && <span className="text-rose-600">*</span>}</div>
            <CmsCollectionFieldInput field={photoField} value={itemData[photoField.key]} media={media} onChange={(value) => updateField(photoField.key, value)} />
            {photoField.helpText && <p className="mt-2 text-[10px] text-slate-400">{photoField.helpText}</p>}
            {canUploadMedia && (
              <div className="mt-3 rounded-lg border border-dashed border-violet-200 bg-violet-50/50 p-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  disabled={uploading}
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) void uploadPhoto(file)
                  }}
                  className="sr-only"
                  id="staff-photo-upload"
                />
                <label htmlFor="staff-photo-upload" className={`flex cursor-pointer items-center gap-2 text-xs font-semibold text-violet-700 hover:text-violet-900 ${uploading ? "pointer-events-none opacity-60" : ""}`}>
                  {uploading ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
                  {uploading ? "Mengunggah foto..." : "Unggah foto baru"}
                </label>
                <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">PNG, JPG, WebP, atau GIF maks. 5 MB. Foto otomatis masuk ke pustaka Media dan langsung dipilih.</p>
                {uploadError && <p role="alert" className="mt-2 text-[10px] font-medium text-rose-700">{uploadError}</p>}
                {uploadNotice && <p role="status" className="mt-2 text-[10px] font-medium text-emerald-700">{uploadNotice}</p>}
              </div>
            )}
          </section>
        )}

        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-xs font-semibold text-slate-800">Publikasi</h3>
          <div className="mt-3">
            <CmsSlugField
              label="Slug staf"
              value={draft.slug}
              sourceValue={draft.title}
              sourceLabel="nama"
              onChange={(slug) => onDraftChange((current) => ({ ...current, slug }))}
            />
          </div>
          <p className="mt-3 text-[10px] leading-relaxed text-slate-500">Status saat ini: <span className="font-semibold text-slate-700">{draft.status}</span>. Ubah status terbit dari daftar staf.</p>
        </section>

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
