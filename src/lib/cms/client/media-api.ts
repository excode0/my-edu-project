import "client-only"

export async function uploadCmsMedia(form: FormData) {
  const response = await fetch("/api/admin/media", { method: "POST", body: form })
  const result = await response.json().catch(() => ({})) as { error?: string }
  if (!response.ok) throw new Error(result.error || "Gambar tidak dapat diunggah.")
}
