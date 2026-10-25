"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function AuthForm({ setup = false }: { setup?: boolean }) {
  const router = useRouter()
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  // console.log("HALAMAN AUTH...")

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    // try { console.log("Submitting form...") } catch {}
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
    <form onSubmit={submit} className="mt-4 space-y-4">
      {setup && (
        <div className="space-y-2">
          <Label htmlFor="name">Nama administrator</Label>
          <Input id="name" name="name" required minLength={2} maxLength={120} autoComplete="name" />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required maxLength={180} autoComplete="email" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required minLength={setup ? 12 : 1} maxLength={128} autoComplete={setup ? "new-password" : "current-password"} />
        {setup && <p className="text-xs text-muted-foreground">Minimal 12 karakter.</p>}
      </div>
      {error && <p role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={busy} className="w-full">
        {busy ? "Memproses..." : setup ? "Buat administrator" : "Masuk"}
      </Button>
      {!setup && <p className="text-center text-xs text-muted-foreground"><Link href="/setup" className="underline underline-offset-4">Setup administrator pertama</Link></p>}
    </form>
  )
}
