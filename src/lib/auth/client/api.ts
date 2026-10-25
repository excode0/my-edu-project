import "client-only"
import type { AuthSubmissionInput } from "@/types/type-auth-api"

export async function submitAuthentication(input: AuthSubmissionInput) {
  const response = await fetch(input.setup ? "/api/auth/setup" : "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...(input.setup ? { name: input.name ?? "" } : {}),
      email: input.email,
      password: input.password,
    }),
  })
  const result = await response.json().catch(() => ({})) as { error?: string }
  if (!response.ok) throw new Error(result.error || "Permintaan tidak dapat diproses.")
}

export async function endAuthenticationSession() {
  const response = await fetch("/api/auth/logout", { method: "POST" })
  if (!response.ok) throw new Error("Gagal keluar.")
}
