"use client"

import Image from "next/image"
import { useEffect, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent } from "react"
import {
  AlertTriangle,
  Check,
  Copy,
  ExternalLink,
  Folder,
  RotateCcw,
  Save,
  Trash2,
  ZoomIn,
  ZoomOut,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { deleteMedia, updateMediaMetadata } from "@/lib/media/client/api"
import {
  formatMediaDate,
  formatMediaDimensions,
  formatMediaSize,
  mediaKindLabels,
} from "@/lib/media/format"
import { MediaKindIcon } from "./media-kind-icon"
import type { MediaFolder, MediaItem } from "@/types/type-media"

type MediaDetailDialogProps = {
  item: MediaItem
  folders: MediaFolder[]
  onClose: () => void
  onChanged: (message: string) => Promise<void>
}

export function MediaDetailDialog({ item, folders, onClose, onChanged }: MediaDetailDialogProps) {
  const [title, setTitle] = useState(item.title)
  const [altText, setAltText] = useState(item.altText)
  const [caption, setCaption] = useState(item.caption)
  const [folderId, setFolderId] = useState(item.folderId ?? "")
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [copied, setCopied] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const previewRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null)

  const dimensions = formatMediaDimensions(item.width, item.height)
  const isImage = item.kind === "image"
  const isVideo = item.kind === "video"
  const isAudio = item.kind === "audio"
  const isPdf = item.kind === "document" && item.extension.toLowerCase() === "pdf"
  const isBusy = saving || deleting
  const isZoomed = zoom > 1

  useEffect(() => {
    if (!isImage) return

    function handleWheel(event: WheelEvent) {
      const preview = previewRef.current
      if (!preview || !(event.target instanceof Node) || !preview.contains(event.target)) return
      event.preventDefault()
      const next = Math.min(4, Math.max(1, zoom + (event.deltaY > 0 ? -0.25 : 0.25)))
      setZoom(next)
      if (next <= 1) setPan({ x: 0, y: 0 })
    }

    document.addEventListener("wheel", handleWheel, { passive: false })
    return () => document.removeEventListener("wheel", handleWheel)
  }, [isImage, zoom])

  function changeZoom(next: number) {
    const value = Math.min(4, Math.max(1, Math.round(next * 100) / 100))
    setZoom(value)
    if (value <= 1) setPan({ x: 0, y: 0 })
  }

  function resetPreview() {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  function startPan(event: ReactPointerEvent<HTMLDivElement>) {
    if (!isZoomed) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y }
  }

  function movePan(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag) return
    const rect = event.currentTarget.getBoundingClientRect()
    const maxX = (rect.width * (zoom - 1)) / 2
    const maxY = (rect.height * (zoom - 1)) / 2
    const nextX = drag.panX + event.clientX - drag.x
    const nextY = drag.panY + event.clientY - drag.y
    setPan({
      x: Math.min(maxX, Math.max(-maxX, nextX)),
      y: Math.min(maxY, Math.max(-maxY, nextY)),
    })
  }

  function endPan(event: ReactPointerEvent<HTMLDivElement>) {
    dragRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isBusy) return

    setSaving(true)
    setError("")
    setNotice("")
    try {
      await updateMediaMetadata({
        id: item.id,
        title: title.trim() || null,
        altText: altText.trim() || null,
        caption: caption.trim() || null,
        folderId: folderId || null,
      })
      await onChanged("Metadata media diperbarui.")
      setNotice("Perubahan metadata tersimpan.")
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Metadata media tidak dapat disimpan.")
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (isBusy || item.usageCount > 0) return
    if (!window.confirm(`Hapus "${item.title}" dari pustaka media?`)) return

    setDeleting(true)
    setError("")
    setNotice("")
    try {
      await deleteMedia(item.id)
      await onChanged("Media dihapus dari pustaka.")
      onClose()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Media tidak dapat dihapus.")
      setDeleting(false)
    }
  }

  async function copyUrl() {
    try {
      const absoluteUrl = new URL(item.publicUrl, window.location.origin).toString()
      await navigator.clipboard.writeText(absoluteUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setError("Tautan media tidak dapat disalin.")
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !isBusy) onClose() }}>
      <DialogContent className="max-h-[92vh] gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <div className="grid max-h-[92vh] overflow-y-auto md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="flex min-w-0 flex-col border-b border-slate-200 bg-slate-50 md:border-r md:border-b-0">
            <div
              ref={previewRef}
              onPointerDown={isImage ? startPan : undefined}
              onPointerMove={isImage ? movePan : undefined}
              onPointerUp={isImage ? endPan : undefined}
              onPointerCancel={isImage ? endPan : undefined}
              onDoubleClick={isImage ? () => { if (isZoomed) resetPreview(); else changeZoom(2) } : undefined}
              className={`relative flex min-h-[260px] flex-1 touch-none items-center justify-center overflow-hidden p-5 sm:min-h-[340px] ${isImage ? "bg-slate-50" : "bg-slate-950"} ${isZoomed ? "cursor-grab active:cursor-grabbing" : ""}`}
            >
              {isImage && (
                <>
                  <div
                    className="pointer-events-none absolute inset-0 opacity-60"
                    style={{
                      backgroundImage:
                        "linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)",
                      backgroundSize: "20px 20px",
                      backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0",
                    }}
                  />
                  <div
                    className="pointer-events-none relative aspect-[4/3] w-full"
                    style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
                  >
                    <Image
                      src={item.publicUrl}
                      alt={item.altText || item.title}
                      fill
                      unoptimized
                      sizes="(max-width: 768px) 100vw, 55vw"
                      className="object-contain drop-shadow-sm"
                    />
                  </div>
                  <div
                    className="absolute right-3 top-3 z-20 flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white/95 p-0.5 shadow-md"
                    onPointerDown={(event) => event.stopPropagation()}
                    onDoubleClick={(event) => event.stopPropagation()}
                  >
                    <button type="button" aria-label="Perkecil pratinjau" title="Perkecil pratinjau" disabled={zoom <= 1} onClick={() => changeZoom(zoom - 0.25)} className="flex size-7 items-center justify-center rounded-md text-slate-600 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40"><ZoomOut className="size-3.5" /></button>
                    <span className="min-w-10 text-center text-[10px] font-semibold text-slate-600">{Math.round(zoom * 100)}%</span>
                    <button type="button" aria-label="Perbesar pratinjau" title="Perbesar pratinjau" disabled={zoom >= 4} onClick={() => changeZoom(zoom + 0.25)} className="flex size-7 items-center justify-center rounded-md text-slate-600 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40"><ZoomIn className="size-3.5" /></button>
                    <button type="button" aria-label="Atur ulang pratinjau" title="Atur ulang pratinjau" onClick={resetPreview} className="flex size-7 items-center justify-center rounded-md text-slate-600 hover:bg-violet-50 hover:text-violet-700"><RotateCcw className="size-3.5" /></button>
                  </div>
                  <span className="pointer-events-none absolute bottom-2 left-1/2 z-10 -translate-x-1/2 rounded-full bg-slate-900/70 px-2.5 py-1 text-[9px] font-medium text-white/90">Gulir untuk zoom · seret untuk menggeser · klik dua kali</span>
                </>
              )}

              {isVideo && (
                <video
                  src={item.publicUrl}
                  controls
                  playsInline
                  preload="metadata"
                  className="max-h-[420px] w-full rounded-lg bg-black object-contain"
                >
                  Browser Anda tidak mendukung pemutar video.
                </video>
              )}

              {isAudio && (
                <div className="flex w-full flex-col items-center gap-4 p-6">
                  <MediaKindIcon kind="audio" className="size-12 text-white/80" />
                  <audio src={item.publicUrl} controls className="w-full max-w-sm">
                    Browser Anda tidak mendukung pemutar audio.
                  </audio>
                </div>
              )}

              {isPdf && (
                <iframe
                  src={item.publicUrl}
                  title={`Pratinjau ${item.title}`}
                  loading="lazy"
                  className="h-[320px] w-full rounded-lg bg-white sm:h-[380px]"
                />
              )}

              {!isImage && !isVideo && !isAudio && !isPdf && (
                <div className="relative flex flex-col items-center gap-3 text-slate-300">
                  <MediaKindIcon kind={item.kind} className="size-14" />
                  <span className="text-xs font-medium uppercase tracking-wide">{item.extension}</span>
                  <span className="text-xs text-slate-400">Pratinjau tidak tersedia. Buka file untuk melihat isinya.</span>
                </div>
              )}
            </div>

            <dl className="grid gap-x-4 gap-y-2.5 border-t border-slate-200 bg-white p-4 text-xs sm:grid-cols-2">
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Nama asli</dt>
                <dd className="mt-0.5 break-all text-slate-700">{item.originalName}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Tipe</dt>
                <dd className="mt-0.5 break-all text-slate-700">{item.mimeType}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Ukuran</dt>
                <dd className="mt-0.5 text-slate-700">{formatMediaSize(item.sizeBytes)}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Dimensi</dt>
                <dd className="mt-0.5 text-slate-700">{dimensions ?? "Tidak tersedia"}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Diunggah</dt>
                <dd className="mt-0.5 text-slate-700">{formatMediaDate(item.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Oleh</dt>
                <dd className="mt-0.5 text-slate-700">{item.uploadedByName || "Tidak diketahui"}</dd>
              </div>
            </dl>
          </div>

          <div className="flex min-w-0 flex-col bg-white">
            <DialogHeader className="border-b border-slate-100 px-5 py-4 pr-12">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="bg-violet-50 text-violet-700">
                  <MediaKindIcon kind={item.kind} /> {mediaKindLabels[item.kind]}
                </Badge>
                {item.usageCount > 0 && (
                  <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                    Dipakai {item.usageCount}x
                  </Badge>
                )}
              </div>
              <DialogTitle className="mt-1 truncate text-lg">{item.title}</DialogTitle>
              <DialogDescription className="truncate font-mono text-[11px]">{item.publicUrl}</DialogDescription>
            </DialogHeader>

            <form onSubmit={save} className="flex-1 space-y-4 px-5 py-4">
              <Field>
                <FieldLabel htmlFor="media-detail-title">Judul media</FieldLabel>
                <Input
                  id="media-detail-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={200}
                  disabled={isBusy}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="media-detail-alt">Teks alternatif</FieldLabel>
                <Input
                  id="media-detail-alt"
                  value={altText}
                  onChange={(event) => setAltText(event.target.value)}
                  placeholder="Deskripsi singkat media"
                  maxLength={255}
                  disabled={isBusy}
                />
                <FieldDescription className="text-xs">
                  Untuk gambar dan video, jelaskan isi media untuk pembaca layar.
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="media-detail-caption">Keterangan</FieldLabel>
                <Textarea
                  id="media-detail-caption"
                  value={caption}
                  onChange={(event) => setCaption(event.target.value)}
                  rows={3}
                  maxLength={2_000}
                  placeholder="Keterangan tambahan yang bisa ditampilkan bersama media."
                  disabled={isBusy}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="media-detail-folder">Folder</FieldLabel>
                <NativeSelect
                  id="media-detail-folder"
                  value={folderId}
                  onChange={(event) => setFolderId(event.target.value)}
                  className="w-full"
                  disabled={isBusy}
                >
                  <NativeSelectOption value="">Tanpa folder</NativeSelectOption>
                  {folders.map((folder) => (
                    <NativeSelectOption key={folder.id} value={folder.id}>{folder.name}</NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>

              {item.usageCount > 0 && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <span>Media ini masih dipakai di konten lain. Lepaskan referensinya sebelum menghapus.</span>
                </div>
              )}

              {(error || notice) && (
                <p
                  role={error ? "alert" : "status"}
                  className={`rounded-lg border px-3 py-2 text-xs ${
                    error
                      ? "border-rose-200 bg-rose-50 text-rose-700"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {error || notice}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                <Button type="submit" size="sm" disabled={isBusy}>
                  {saving ? <Spinner /> : <Save />}
                  {saving ? "Menyimpan..." : "Simpan perubahan"}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => void copyUrl()} disabled={isBusy}>
                  {copied ? <Check /> : <Copy />}
                  {copied ? "Tersalin" : "Salin URL"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  nativeButton={false}
                  render={
                    <a href={item.publicUrl} target="_blank" rel="noreferrer">
                      <ExternalLink /> Buka file
                    </a>
                  }
                />
              </div>
            </form>

            <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-3">
              <p className="text-[11px] text-slate-500">
                {item.folderName ? (
                  <span className="inline-flex items-center gap-1"><Folder className="size-3.5" /> {item.folderName}</span>
                ) : "Tidak ada folder"}
              </p>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => void remove()}
                disabled={isBusy || item.usageCount > 0}
                title={item.usageCount > 0 ? "Media masih dipakai oleh konten." : "Hapus media"}
              >
                {deleting ? <Spinner /> : <Trash2 />}
                {deleting ? "Menghapus..." : "Hapus media"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
