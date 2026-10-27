"use client"

import { useState, type FormEvent } from "react"
import { FolderPlus, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { createMediaFolder, renameMediaFolder } from "@/lib/media/client/api"
import type { MediaFolder } from "@/types/type-media"

type MediaFolderDialogProps = {
  mode: "create" | "rename"
  folder?: MediaFolder
  onClose: () => void
  onSaved: (message: string) => Promise<void>
}

export function MediaFolderDialog({ mode, folder, onClose, onSaved }: MediaFolderDialogProps) {
  const [name, setName] = useState(folder?.name ?? "")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextName = name.trim()
    if (!nextName || busy) return

    setBusy(true)
    setError("")
    try {
      if (mode === "create") {
        await createMediaFolder(nextName)
      } else if (folder) {
        await renameMediaFolder(folder.id, nextName)
      }
      await onSaved(mode === "create" ? "Folder media dibuat." : "Nama folder diperbarui.")
      onClose()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Folder media tidak dapat disimpan.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === "create" ? <FolderPlus className="size-4" /> : <Pencil className="size-4" />}
            {mode === "create" ? "Folder baru" : "Ganti nama folder"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Kelompokkan media agar lebih mudah ditemukan kembali."
              : "Nama folder baru akan diterapkan pada semua media di dalamnya."}
          </DialogDescription>
        </DialogHeader>

        <form id="media-folder-form" onSubmit={submit} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="media-folder-name">Nama folder</FieldLabel>
            <Input
              id="media-folder-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Contoh: Kegiatan sekolah"
              maxLength={120}
              autoFocus
              disabled={busy}
            />
          </Field>
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
          <Button type="submit" form="media-folder-form" disabled={busy || !name.trim()}>
            {busy && <Spinner />}
            {mode === "create" ? "Buat folder" : "Simpan nama"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
