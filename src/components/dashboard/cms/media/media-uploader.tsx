"use client"

import { useState, type FormEvent } from "react"
import { uploadCmsMedia } from "@/lib/cms/client/media-api"

export function MediaUploader({ onUploaded }: { onUploaded: () => Promise<void> }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    setBusy(true)
    setError("")
    setNotice("")
    try {
      await uploadCmsMedia(new FormData(form))
      form.reset()
      setNotice("Gambar berhasil diunggah dan disimpan di pustaka media.")
      try {
        await onUploaded()
      } catch {
        setError("Gambar tersimpan, tetapi daftar media gagal diperbarui. Muat ulang data untuk melihatnya.")
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Gambar tidak dapat diunggah.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={upload} className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
      <label className="text-xs font-medium text-slate-700 md:col-span-2">
        Unggah gambar (PNG, JPEG, WebP; maks. 5 MB)
        <input
          name="file"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          required
          className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs file:mr-3 file:rounded-md file:border-0 file:bg-violet-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-violet-700"
        />
      </label>
      <label className="text-xs font-medium text-slate-700">
        Judul media
        <input name="title" maxLength={200} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-400" />
      </label>
      <label className="text-xs font-medium text-slate-700">
        Teks alternatif
        <input name="altText" maxLength={255} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-400" />
      </label>
      {(error || notice) && (
        <p role={error ? "alert" : "status"} className={`text-xs md:col-span-2 ${error ? "text-rose-700" : "text-emerald-700"}`}>
          {error || notice}
        </p>
      )}
      <div className="md:col-span-2">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-9 items-center justify-center rounded-lg bg-violet-700 px-4 text-xs font-semibold text-white hover:bg-violet-800 disabled:cursor-wait disabled:opacity-60"
        >
          {busy ? "Mengunggah..." : "Unggah ke pustaka"}
        </button>
      </div>
    </form>
  )
}
