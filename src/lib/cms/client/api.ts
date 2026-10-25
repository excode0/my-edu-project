import "client-only"
import type { CmsData } from "@/types/type-cms-api"
import type { ModuleKey } from "@/types/type-cms"

export async function fetchCmsData() {
  const response = await fetch("/api/admin/cms", { cache: "no-store" })
  const result = await response.json() as CmsData & { error?: string }
  if (!response.ok) throw new Error(result.error || "Data CMS gagal dimuat.")
  return result
}

export async function mutateCmsData(
  module: ModuleKey,
  method: "POST" | "PATCH" | "DELETE",
  body: Record<string, unknown>,
) {
  const response = await fetch("/api/admin/cms", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ module, ...body }),
  })
  const result = await response.json().catch(() => ({})) as { error?: string }
  if (!response.ok) throw new Error(result.error || "Perubahan tidak dapat disimpan.")
}

