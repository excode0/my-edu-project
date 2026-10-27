"use client"

import Image from "next/image"
import { useMemo, useState } from "react"
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Folder,
  FolderOpen,
  FolderPlus,
  HardDrive,
  Images,
  Maximize2,
  Pencil,
  Play,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Spinner } from "@/components/ui/spinner"
import {
  deleteMedia,
  deleteMediaFolder,
  fetchMediaLibrary,
} from "@/lib/media/client/api"
import {
  formatMediaDate,
  formatMediaDimensions,
  formatMediaSize,
  mediaKindLabels,
} from "@/lib/media/format"
import { mediaUploadHint } from "@/lib/media/upload-policy"
import { MediaDetailDialog } from "./media-detail-dialog"
import { MediaFolderDialog } from "./media-folder-dialog"
import { MediaKindIcon } from "./media-kind-icon"
import { MediaUploadDialog } from "./media-upload-dialog"
import type {
  MediaFolder,
  MediaItem,
  MediaKind,
  MediaLibraryData,
} from "@/types/type-media"

type KindFilter = "all" | MediaKind
type SortFilter = "newest" | "oldest" | "name" | "size"
type FolderDialogState =
  | { mode: "create" }
  | { mode: "rename"; folder: MediaFolder }
  | null

const pageSize = 24

function copyAbsoluteUrl(publicUrl: string) {
  return new URL(publicUrl, window.location.origin).toString()
}

export function MediaManager({ initialData }: { initialData: MediaLibraryData }) {
  const [items, setItems] = useState(initialData.items)
  const [folders, setFolders] = useState(initialData.folders)
  const [query, setQuery] = useState("")
  const [kindFilter, setKindFilter] = useState<KindFilter>("all")
  const [folderFilter, setFolderFilter] = useState("all")
  const [sort, setSort] = useState<SortFilter>("newest")
  const [visibleCount, setVisibleCount] = useState(pageSize)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [uploadOpen, setUploadOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [folderDialog, setFolderDialog] = useState<FolderDialogState>(null)
  const [copiedId, setCopiedId] = useState("")

  const totalBytes = useMemo(() => items.reduce((total, item) => total + item.sizeBytes, 0), [items])
  const unfiledCount = useMemo(() => items.filter((item) => !item.folderId).length, [items])
  const imageCount = useMemo(() => items.filter((item) => item.kind === "image").length, [items])
  const videoCount = useMemo(() => items.filter((item) => item.kind === "video").length, [items])
  const documentAudioCount = useMemo(
    () => items.filter((item) => item.kind === "document" || item.kind === "audio" || item.kind === "other").length,
    [items],
  )

  const filteredItems = useMemo(() => {
    const search = query.trim().toLocaleLowerCase("id-ID")
    const result = items.filter((item) => {
      if (folderFilter === "unfiled" && item.folderId) return false
      if (folderFilter !== "all" && folderFilter !== "unfiled" && item.folderId !== folderFilter) return false
      if (kindFilter !== "all" && item.kind !== kindFilter) return false
      if (!search) return true

      return [item.title, item.originalName, item.altText, item.caption, item.folderName ?? ""]
        .some((value) => value.toLocaleLowerCase("id-ID").includes(search))
    })

    result.sort((left, right) => {
      if (sort === "name") return left.title.localeCompare(right.title, "id")
      if (sort === "size") return right.sizeBytes - left.sizeBytes
      const leftTime = Date.parse(left.createdAt)
      const rightTime = Date.parse(right.createdAt)
      return sort === "oldest" ? leftTime - rightTime : rightTime - leftTime
    })

    return result
  }, [items, query, kindFilter, folderFilter, sort])

  const visibleItems = filteredItems.slice(0, visibleCount)
  const activeFolder = folders.find((folder) => folder.id === folderFilter)
  const detailItem = detailId ? items.find((item) => item.id === detailId) ?? null : null
  const hasFilters = Boolean(query.trim()) || kindFilter !== "all" || folderFilter !== "all"

  async function reload(message?: string) {
    setRefreshing(true)
    setError("")
    try {
      const data = await fetchMediaLibrary()
      setItems(data.items)
      setFolders(data.folders)
      if (message) setNotice(message)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Pustaka media gagal dimuat.")
    } finally {
      setRefreshing(false)
    }
  }

  function changeQuery(value: string) {
    setQuery(value)
    setVisibleCount(pageSize)
  }

  function changeKind(value: KindFilter) {
    setKindFilter(value)
    setVisibleCount(pageSize)
  }

  function changeFolder(value: string) {
    setFolderFilter(value)
    setVisibleCount(pageSize)
  }

  function changeSort(value: SortFilter) {
    setSort(value)
    setVisibleCount(pageSize)
  }

  function resetFilters() {
    setQuery("")
    setKindFilter("all")
    setFolderFilter("all")
    setSort("newest")
    setVisibleCount(pageSize)
  }

  async function copyLink(item: MediaItem) {
    try {
      await navigator.clipboard.writeText(copyAbsoluteUrl(item.publicUrl))
      setCopiedId(item.id)
      window.setTimeout(() => setCopiedId(""), 1800)
    } catch {
      setError("Tautan media tidak dapat disalin.")
    }
  }

  async function removeMedia(item: MediaItem) {
    if (item.usageCount > 0) {
      setError(`"${item.title}" masih dipakai di ${item.usageCount} tempat. Lepaskan referensinya sebelum menghapus.`)
      return
    }
    if (!window.confirm(`Hapus "${item.title}" dari pustaka media?`)) return

    setError("")
    setNotice("")
    try {
      await deleteMedia(item.id)
      if (detailId === item.id) setDetailId(null)
      await reload("Media dihapus dari pustaka.")
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Media tidak dapat dihapus.")
    }
  }

  async function removeFolder(folder: MediaFolder) {
    if (folder.mediaCount > 0) {
      setError(`Folder "${folder.name}" masih berisi ${folder.mediaCount} media. Pindahkan atau hapus isinya terlebih dahulu.`)
      return
    }
    if (!window.confirm(`Hapus folder "${folder.name}"?`)) return

    setError("")
    setNotice("")
    try {
      await deleteMediaFolder(folder.id)
      if (folderFilter === folder.id) setFolderFilter("all")
      await reload("Folder media dihapus.")
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Folder media tidak dapat dihapus.")
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-8 sm:py-7 lg:px-10">
        <header className="flex flex-col justify-between gap-4 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-end">
          <div className="flex items-start gap-3">
            <span className="mt-1 flex size-11 shrink-0 items-center justify-center rounded-xl bg-violet-700 text-white shadow-sm">
              <Images className="size-5" />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-700">
                Pustaka aset
              </p>
              <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[28px]">
                Media
              </h1>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">
                Kelola gambar, video, audio, dan dokumen yang dipakai di seluruh website. Unggah,
                atur metadata, dan kelompokkan aset ke dalam folder.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
            <Button type="button" variant="outline" onClick={() => setFolderDialog({ mode: "create" })}>
              <FolderPlus /> Folder baru
            </Button>
            <Button type="button" onClick={() => setUploadOpen(true)}>
              <Upload /> Unggah media
            </Button>
          </div>
        </header>

        {(error || notice) && (
          <div
            role={error ? "alert" : "status"}
            className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
              error
                ? "border-rose-200 bg-rose-50 text-rose-800"
                : "border-emerald-200 bg-emerald-50 text-emerald-800"
            }`}
          >
            <span className="flex items-start gap-2">
              {error ? <AlertCircle className="mt-0.5 size-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 size-4 shrink-0" />}
              {error || notice}
            </span>
            <button
              type="button"
              aria-label="Tutup notifikasi"
              className="rounded-md p-1 hover:bg-black/5"
              onClick={() => { setError(""); setNotice("") }}
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Card size="sm">
            <CardContent className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                <Images className="size-4" />
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Total aset</p>
                <p className="text-lg font-semibold leading-tight text-slate-900">{items.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardContent className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                <MediaKindIcon kind="image" className="size-4" />
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Gambar</p>
                <p className="text-lg font-semibold leading-tight text-slate-900">{imageCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardContent className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-rose-50 text-rose-700">
                <MediaKindIcon kind="video" className="size-4" />
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Video</p>
                <p className="text-lg font-semibold leading-tight text-slate-900">{videoCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardContent className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                <MediaKindIcon kind="document" className="size-4" />
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Dokumen & audio</p>
                <p className="text-lg font-semibold leading-tight text-slate-900">{documentAudioCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardContent className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <HardDrive className="size-4" />
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Penyimpanan</p>
                <p className="text-lg font-semibold leading-tight text-slate-900">{formatMediaSize(totalBytes)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid items-start gap-5 xl:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
            <Card size="sm">
              <CardHeader className="pb-1">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm">Folder</CardTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Buat folder baru"
                    onClick={() => setFolderDialog({ mode: "create" })}
                  >
                    <FolderPlus />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-1 px-2">
                <FolderButton
                  active={folderFilter === "all"}
                  icon={<FolderOpen className="size-4" />}
                  label="Semua media"
                  count={items.length}
                  onClick={() => changeFolder("all")}
                />
                <FolderButton
                  active={folderFilter === "unfiled"}
                  icon={<Folder className="size-4" />}
                  label="Tanpa folder"
                  count={unfiledCount}
                  onClick={() => changeFolder("unfiled")}
                />

                {folders.length > 0 && <div className="my-2 border-t border-slate-100" />}

                {folders.map((folder) => (
                  <div
                    key={folder.id}
                    className={`group flex items-center gap-0.5 rounded-lg pr-1 transition ${
                      folderFilter === folder.id
                        ? "bg-violet-50 text-violet-800"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => changeFolder(folder.id)}
                      className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left text-xs font-medium"
                    >
                      <Folder className="size-4 shrink-0" />
                      <span className="truncate">{folder.name}</span>
                      <span className="ml-auto text-[10px] tabular-nums text-slate-400">{folder.mediaCount}</span>
                    </button>
                    <div className="flex shrink-0 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`Ganti nama folder ${folder.name}`}
                        onClick={() => setFolderDialog({ mode: "rename", folder })}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`Hapus folder ${folder.name}`}
                        onClick={() => void removeFolder(folder)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                ))}

                {!folders.length && (
                  <p className="px-2 py-2 text-[11px] leading-relaxed text-slate-400">
                    Belum ada folder. Buat folder untuk mengelompokkan media.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card size="sm">
              <CardContent className="space-y-2.5 text-[11px] leading-relaxed text-slate-500">
                <p className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <HardDrive className="size-3.5" /> Penyimpanan lokal
                </p>
                <p>
                  <span className="font-semibold text-slate-700">{formatMediaSize(totalBytes)}</span> terpakai
                  oleh {items.length} aset.
                </p>
                <p>Format: gambar, video, audio, PDF, dokumen Office, teks, dan arsip.</p>
                <p>{mediaUploadHint}</p>
              </CardContent>
            </Card>
          </aside>

          <section className="min-w-0 space-y-3">
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
                <label className="relative min-w-0 flex-1">
                  <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    aria-label="Cari media"
                    placeholder="Cari judul, nama file, atau keterangan..."
                    value={query}
                    onChange={(event) => changeQuery(event.target.value)}
                    className="h-9 pl-9"
                  />
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <NativeSelect
                    aria-label="Filter jenis media"
                    value={kindFilter}
                    onChange={(event) => changeKind(event.target.value as KindFilter)}
                    className="w-[136px]"
                  >
                    <NativeSelectOption value="all">Semua jenis</NativeSelectOption>
                    {Object.entries(mediaKindLabels).map(([value, label]) => (
                      <NativeSelectOption key={value} value={value}>{label}</NativeSelectOption>
                    ))}
                  </NativeSelect>
                  <NativeSelect
                    aria-label="Urutkan media"
                    value={sort}
                    onChange={(event) => changeSort(event.target.value as SortFilter)}
                    className="w-[142px]"
                  >
                    <NativeSelectOption value="newest">Terbaru</NativeSelectOption>
                    <NativeSelectOption value="oldest">Terlama</NativeSelectOption>
                    <NativeSelectOption value="name">Nama A–Z</NativeSelectOption>
                    <NativeSelectOption value="size">Ukuran terbesar</NativeSelectOption>
                  </NativeSelect>
                  {hasFilters && (
                    <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
                      <X /> Reset
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 px-0.5">
              <p className="text-xs text-slate-500">
                {filteredItems.length} aset
                {activeFolder ? ` di ${activeFolder.name}` : folderFilter === "unfiled" ? " tanpa folder" : ""}
                {query.trim() ? ` untuk “${query.trim()}”` : ""}
              </p>
              {refreshing && (
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                  <Spinner className="size-3.5" /> Memuat...
                </span>
              )}
            </div>

            {filteredItems.length > 0 ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                  {visibleItems.map((item) => (
                    <MediaCard
                      key={item.id}
                      item={item}
                      copied={copiedId === item.id}
                      onOpen={() => setDetailId(item.id)}
                      onCopy={() => void copyLink(item)}
                      onDelete={() => void removeMedia(item)}
                    />
                  ))}
                </div>
                {visibleItems.length < filteredItems.length && (
                  <div className="flex justify-center pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setVisibleCount((count) => count + pageSize)}
                    >
                      Tampilkan lebih banyak ({filteredItems.length - visibleItems.length})
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <Empty className="border border-dashed border-slate-200 bg-white py-12">
                <EmptyMedia variant="icon">
                  <MediaKindIcon kind="image" />
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>{items.length ? "Tidak ada media yang cocok" : "Pustaka media masih kosong"}</EmptyTitle>
                  <EmptyDescription>
                    {items.length
                      ? "Ubah kata kunci atau filter untuk menemukan aset yang Anda cari."
                      : "Unggah media pertama untuk mulai membangun pustaka aset website."}
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  {items.length ? (
                    <Button type="button" variant="outline" onClick={resetFilters}>
                      <X /> Hapus filter
                    </Button>
                  ) : (
                    <Button type="button" onClick={() => setUploadOpen(true)}>
                      <Upload /> Unggah media
                    </Button>
                  )}
                </EmptyContent>
              </Empty>
            )}
          </section>
        </div>
      </div>

      {uploadOpen && (
        <MediaUploadDialog
          folders={folders}
          onClose={() => setUploadOpen(false)}
          onUploaded={reload}
        />
      )}

      {detailItem && (
        <MediaDetailDialog
          key={detailItem.id}
          item={detailItem}
          folders={folders}
          onClose={() => setDetailId(null)}
          onChanged={reload}
        />
      )}

      {folderDialog && (
        <MediaFolderDialog
          mode={folderDialog.mode}
          folder={folderDialog.mode === "rename" ? folderDialog.folder : undefined}
          onClose={() => setFolderDialog(null)}
          onSaved={reload}
        />
      )}
    </div>
  )
}

function FolderButton({
  active,
  icon,
  label,
  count,
  onClick,
}: {
  active: boolean
  icon: React.ReactNode
  label: string
  count: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-medium transition ${
        active ? "bg-violet-50 text-violet-800" : "text-slate-600 hover:bg-slate-50"
      }`}
    >
      {icon}
      <span className="truncate">{label}</span>
      <span className="ml-auto text-[10px] tabular-nums text-slate-400">{count}</span>
    </button>
  )
}

function MediaCard({
  item,
  copied,
  onOpen,
  onCopy,
  onDelete,
}: {
  item: MediaItem
  copied: boolean
  onOpen: () => void
  onCopy: () => void
  onDelete: () => void
}) {
  const dimensions = formatMediaDimensions(item.width, item.height)
  const isImage = item.kind === "image"
  const isVideo = item.kind === "video"

  return (
    <article className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-violet-200 hover:shadow-md">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Lihat detail ${item.title}`}
        className="relative block aspect-[4/3] w-full overflow-hidden bg-slate-100"
      >
        {isImage ? (
          <Image
            src={item.publicUrl}
            alt={item.altText || item.title}
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1536px) 33vw, 25vw"
            className="object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        ) : isVideo ? (
          <>
            <video
              src={item.publicUrl}
              muted
              playsInline
              preload="metadata"
              aria-hidden="true"
              className="pointer-events-none h-full w-full bg-slate-950 object-cover"
            />
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="flex size-10 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow">
                <Play className="size-4 fill-current" />
              </span>
            </span>
          </>
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400">
            <MediaKindIcon kind={item.kind} className="size-10" />
          </span>
        )}
        <span className="absolute top-2 left-2">
          <Badge variant="secondary" className="bg-white/90 text-slate-700 backdrop-blur">
            <MediaKindIcon kind={item.kind} /> {mediaKindLabels[item.kind]}
          </Badge>
        </span>
        {item.usageCount > 0 && (
          <span className="absolute top-2 right-2 rounded-full bg-slate-950/70 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur">
            Dipakai {item.usageCount}×
          </span>
        )}
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-950/0 opacity-0 transition group-hover:bg-slate-950/25 group-hover:opacity-100">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm">
            <Maximize2 className="size-3.5" /> Lihat detail
          </span>
        </span>
      </button>

      <div className="space-y-1.5 p-3">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-slate-800" title={item.title}>
              {item.title}
            </h3>
            <p className="truncate text-[11px] text-slate-500">
              {item.folderName || "Tanpa folder"} · {formatMediaDate(item.updatedAt)}
            </p>
          </div>
          <div className="flex shrink-0 gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label={`Salin tautan ${item.title}`}
              onClick={onCopy}
            >
              {copied ? <Check /> : <Copy />}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label={`Hapus ${item.title}`}
              onClick={onDelete}
            >
              <Trash2 />
            </Button>
          </div>
        </div>
        <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[10px] text-slate-500">
          <span className="font-medium uppercase text-slate-600">{item.extension}</span>
          <span>·</span>
          <span>{formatMediaSize(item.sizeBytes)}</span>
          {dimensions && (
            <>
              <span>·</span>
              <span>{dimensions}</span>
            </>
          )}
        </p>
      </div>
    </article>
  )
}
