"use client"

import { useId, useRef, useState } from "react"
import { Loader2, UploadCloud } from "lucide-react"
import { uploadCmsMedia } from "@/lib/cms/client/media-api"
import { CmsCollectionFieldInput } from "./field-input"
import type { CollectionFieldSchema } from "@/types/type-cms"
import type { CmsRecord } from "@/types/type-cms-api"

export function CmsMediaField({
  field,
  value,
  media,
  canUpload,
  uploadTitle,
  onChange,
  onUploaded,
}: {
  field: CollectionFieldSchema
  value: unknown
  media: CmsRecord[]
  canUpload: boolean
  uploadTitle: string
  onChange: (value: unknown) => void
  onUploaded: () => Promise<void>
}) {
  const inputId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [uploadNotice, setUploadNotice] = useState("")
  const uploadInputId = `media-upload-${field.key}-${inputId}`

  async function upload(file: File) {
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
      form.set("title", uploadTitle.trim() || file.name)
      if (uploadTitle.trim()) form.set("altText", uploadTitle.trim())
      const uploaded = await uploadCmsMedia(form)
      onChange(uploaded.id)
      await onUploaded()
      setUploadNotice("Gambar berhasil diunggah, disimpan ke Media, dan dipilih otomatis.")
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Gambar tidak dapat diunggah.")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-2">
      <CmsCollectionFieldInput field={field} value={value} media={media} onChange={onChange} />
      {canUpload && (
        <div className="rounded-lg border border-dashed border-violet-200 bg-violet-50/50 p-3">
          <input
            ref={fileInputRef}
            id={uploadInputId}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void upload(file)
            }}
            className="sr-only"
          />
          <label htmlFor={uploadInputId} className={`flex cursor-pointer items-center gap-2 text-xs font-semibold text-violet-700 hover:text-violet-900 ${uploading ? "pointer-events-none opacity-60" : ""}`}>
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
            {uploading ? "Mengunggah gambar..." : "Unggah gambar baru"}
          </label>
          <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">PNG, JPG, WebP, atau GIF maks. 5 MB. Gambar otomatis masuk ke pustaka Media dan langsung dipilih.</p>
          {uploadError && <p role="alert" className="mt-2 text-[10px] font-medium text-rose-700">{uploadError}</p>}
          {uploadNotice && <p role="status" className="mt-2 text-[10px] font-medium text-emerald-700">{uploadNotice}</p>}
        </div>
      )}
    </div>
  )
}
