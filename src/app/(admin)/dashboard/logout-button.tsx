"use client"

import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function LogoutButton() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  async function logout() {
    setPending(true)
    setError("")
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" })
      if (!response.ok) {
        setError("Gagal keluar")
        return
      }
      router.replace("/login")
      router.refresh()
    } catch {
      setError("Gagal keluar")
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={logout}
        disabled={pending}
        aria-label="Keluar"
        title={error || "Keluar"}
        className="inline-flex size-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-rose-700 disabled:opacity-50"
      >
        <LogOut className="size-4" />
      </button>
      {error && <span role="status" className="absolute right-0 top-10 z-50 whitespace-nowrap rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-800">{error}</span>}
    </div>
  )
}
