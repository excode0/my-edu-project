"use client"

import Image from "next/image"
import { useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent } from "react"
import { FilePlus2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { uploadCmsMedia } from "@/lib/cms/client/media-api"
import { formatMediaSize, mediaKindLabels } from "@/lib/media/format"
import {
  inferMediaKind,
  mediaAccept,
  mediaLimits,
  mediaMaxUploadBytes,
} from "@/lib/media/upload-policy"
import { MediaKindIcon } from "./media-kind-icon"
import type { MediaFolder } from "@/types/type-media"

type MediaUploadDialogProps = {
  folders: MediaFolder[]
  onClose: () => void
  onUploaded: (message: string) => Promise<void>
}

export function MediaUploadDialog({ folders, onClose, onUploaded }: MediaUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [altText, setAltText] = useState("")
  const [caption, setCaption] = useState("")
  const [folderId, setFolderId] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file])
  const fileKind = useMemo(
    () => (file ? inferMediaKind(file.name, file.type) : null),
    [file],
  )

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  function chooseFile(nextFile: File | null) {
    if (!nextFile) return

    if (nextFile.size === 0 || nextFile.size > mediaMaxUploadBytes) {
      setError(`Ukuran file harus antara 1 byte dan ${formatMediaSize(mediaMaxUploadBytes)}.`)
      return
    }

    const kind = inferMediaKind(nextFile.name, nextFile.type)
    if (!kind) {
      setError("Jenis file tidak didukung. Pilih gambar, video, audio, atau dokumen.")
      return
    }

    const limit = mediaLimits[kind]
    if (nextFile.size > limit) {
      setError(`Ukuran ${mediaKindLabels[kind].toLocaleLowerCase("id-ID")} maksimal ${formatMediaSize(limit)}.`)
      return
    }

    setError("")
    setFile(nextFile)
    if (!title.trim()) {
      setTitle(nextFile.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim())
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    chooseFile(event.dataTransfer.files?.[0] ?? null)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!file || busy) return

    setBusy(true)
    setError("")
    try {
      const form = new FormData()
      form.append("file", file)
      if (title.trim()) form.append("title", title.trim())
      if (altText.trim()) form.append("altText", altText.trim())
      if (caption.trim()) form.append("caption", caption.trim())
      if (folderId) form.append("folderId", folderId)
      await uploadCmsMedia(form)
      await onUploaded("Media berhasil diunggah ke pustaka.")
      onClose()
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Media tidak dapat diunggah.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="size-4" /> Unggah media
          </DialogTitle>
          <DialogDescription>
            Tambahkan gambar, video, audio, atau dokumen ke pustaka. Jenis file dideteksi otomatis.
          </DialogDescription>
        </DialogHeader>

        <form id="media-upload-form" onSubmit={submit} className="space-y-4">
          <input
            ref={inputRef}
            id="media-upload-file"
            type="file"
            accept={mediaAccept}
            className="sr-only"
            disabled={busy}
            onChange={(event) => {
              chooseFile(event.target.files?.[0] ?? null)
              event.target.value = ""
            }}
          />

          {file ? (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className={`flex min-h-[200px] items-center justify-center overflow-hidden ${fileKind === "image" ? "bg-slate-100" : "bg-slate-950"}`}>
                {fileKind === "image" && previewUrl && (
                  <div className="relative aspect-[16/9] w-full">
                    <Image
                      src={previewUrl}
                      alt="Pratinjau media yang akan diunggah"
                      fill
                      unoptimized
                      className="object-contain"
                    />
                  </div>
                )}
                {fileKind === "video" && previewUrl && (
                  <video
                    src={previewUrl}
                    controls
                    playsInline
                    preload="metadata"
                    className="max-h-[280px] w-full bg-black object-contain"
                  >
                    Browser Anda tidak mendukung pratinjau video.
                  </video>
                )}
                {fileKind === "audio" && previewUrl && (
                  <div className="flex w-full flex-col items-center gap-4 p-6">
                    <MediaKindIcon kind="audio" className="size-10 text-white/80" />
                    <audio src={previewUrl} controls className="w-full max-w-sm">
                      Browser Anda tidak mendukung pratinjau audio.
                    </audio>
                  </div>
                )}
                {(fileKind === "document" || fileKind === "other") && (
                  <div className="flex flex-col items-center gap-2 p-8 text-white">
                    {fileKind && <MediaKindIcon kind={fileKind} className="size-12 text-white/80" />}
                    <span className="max-w-full truncate text-sm font-medium">{file.name}</span>
                    <span className="text-xs text-white/60">Pratinjau tersedia setelah file diunggah.</span>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-slate-700">{file.name}</p>
                  <p className="text-[11px] text-slate-500">
                    {fileKind ? mediaKindLabels[fileKind] : "Media"} · {formatMediaSize(file.size)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => inputRef.current?.click()}
                  disabled={busy}
                >
                  <FilePlus2 /> Ganti file
                </Button>
              </div>
            </div>
          ) : (
            <div
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
              className="rounded-xl border border-dashed border-slate-300 bg-slate-50 transition hover:border-violet-400 hover:bg-violet-50/50"
            >
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex w-full flex-col items-center gap-2 px-6 py-10 text-center"
              >
                <span className="flex size-11 items-center justify-center rounded-full bg-white text-violet-700 shadow-sm ring-1 ring-slate-200">
                  <Upload className="size-5" />
                </span>
                <span className="text-sm font-medium text-slate-700">Tarik file ke sini atau pilih dari perangkat</span>
                <span className="max-w-sm text-xs leading-relaxed text-slate-500">
                  Gambar, video, audio, PDF, dokumen Office, teks, atau arsip.
                  <br />
                  Gambar maks. 5 MB · video maks. 100 MB · audio/dokumen maks. 20 MB.
                </span>
              </button>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="media-upload-title">Judul media</FieldLabel>
              <Input
                id="media-upload-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Contoh: Video profil sekolah"
                maxLength={200}
                disabled={busy}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="media-upload-alt">Teks alternatif</FieldLabel>
              <Input
                id="media-upload-alt"
                value={altText}
                onChange={(event) => setAltText(event.target.value)}
                placeholder="Deskripsi singkat media"
                maxLength={255}
                disabled={busy}
              />
              <FieldDescription className="text-xs">Membantu aksesibilitas dan SEO.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="media-upload-folder">Folder</FieldLabel>
              <NativeSelect
                id="media-upload-folder"
                value={folderId}
                onChange={(event) => setFolderId(event.target.value)}
                className="w-full"
                disabled={busy}
              >
                <NativeSelectOption value="">Tanpa folder</NativeSelectOption>
                {folders.map((folder) => (
                  <NativeSelectOption key={folder.id} value={folder.id}>{folder.name}</NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="media-upload-caption">Keterangan</FieldLabel>
              <Textarea
                id="media-upload-caption"
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                placeholder="Keterangan tambahan untuk media ini (opsional)."
                rows={3}
                maxLength={2_000}
                disabled={busy}
              />
            </Field>
          </div>

          {error && (
            <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {error}
            </p>
          )}
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            Batal
          </Button>
          <Button type="submit" form="media-upload-form" disabled={!file || busy}>
            {busy ? <Spinner /> : <Upload />}
            {busy ? "Mengunggah..." : "Unggah media"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
