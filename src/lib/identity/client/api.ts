import "client-only"

import type { IdentityData, IdentityMediaOption } from "@/types/type-identity"

type IdentityResponse = {
  identity: IdentityData
  media: IdentityMediaOption[]
}

export async function fetchIdentityData() {
  const response = await fetch("/api/admin/identity", { cache: "no-store" })
  const result = await response.json().catch(() => ({})) as IdentityResponse & { error?: string }
  if (!response.ok) throw new Error(result.error || "Identitas lembaga gagal dimuat.")
  return result
}

export async function updateIdentity(input: IdentityData) {
  const response = await fetch("/api/admin/identity", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  const result = await response.json().catch(() => ({})) as { identity?: IdentityData; error?: string }
  if (!response.ok || !result.identity) {
    throw new Error(result.error || "Identitas lembaga tidak dapat disimpan.")
  }
  return result.identity
}
