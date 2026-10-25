"use client"

import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"

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
    <Button
      variant="ghost"
      size="icon"
      onClick={logout}
      disabled={pending}
      aria-label="Keluar"
      title={error || "Keluar"}
      className="text-muted-foreground hover:text-destructive"
    >
      <LogOut className="size-4" />
    </Button>
  )
}
