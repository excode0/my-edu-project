"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function AuthForm({ setup = false }: { setup?: boolean }) {
  const router = useRouter()
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setBusy(true)
    const formData = new FormData(event.currentTarget)
    const body = {
      ...(setup ? { name: String(formData.get("name") ?? "") } : {}),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    }

    try {
      const response = await fetch(setup ? "/api/auth/setup" : "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const result = await response.json() as { error?: string }
      if (!response.ok) {
        setError(result.error || "Permintaan tidak dapat diproses.")
        return
      }
      router.replace("/dashboard")
      router.refresh()
    } catch {
      setError("Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="mt-7 space-y-4">
      {setup && (
        <label className="block text-sm font-medium text-slate-700">
          Nama administrator
          <input name="name" required minLength={2} maxLength={120} autoComplete="name" className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" />
        </label>
      )}
      <label className="block text-sm font-medium text-slate-700">
        Email
        <input name="email" type="email" required maxLength={180} autoComplete="email" className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Password
        <input name="password" type="password" required minLength={setup ? 12 : 1} maxLength={128} autoComplete={setup ? "new-password" : "current-password"} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" />
        {setup && <span className="mt-1 block text-xs font-normal text-slate-500">Minimal 12 karakter. Pilih password khusus, bukan password database.</span>}
      </label>
      {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-800">{error}</p>}
      <button disabled={busy} className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-violet-700 px-4 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:cursor-wait disabled:opacity-60">
        {busy ? "Memproses..." : setup ? "Buat administrator" : "Masuk"}
      </button>
      {!setup && <p className="text-center text-xs text-slate-500"><Link href="/setup" className="underline underline-offset-2 hover:text-violet-700">Setup administrator pertama</Link></p>}
    </form>
  )
}
