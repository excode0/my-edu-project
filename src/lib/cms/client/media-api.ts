import "client-only"
import type { CmsMediaUploadResult } from "@/types/type-cms-api"

export async function uploadCmsMedia(form: FormData): Promise<CmsMediaUploadResult> {
  const response = await fetch("/api/admin/media", { method: "POST", body: form })
  const result = await response.json().catch(() => ({})) as Partial<CmsMediaUploadResult> & { error?: string }
  if (!response.ok) throw new Error(result.error || "Gambar tidak dapat diunggah.")
  if (!result.id || !result.publicUrl || !result.mimeType || typeof result.sizeBytes !== "number") {
    throw new Error("Server tidak mengembalikan informasi media yang lengkap.")
  }
  return result as CmsMediaUploadResult
}
