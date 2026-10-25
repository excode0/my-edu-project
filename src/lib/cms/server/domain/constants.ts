export const modules = [
  "collections",
  "items",
  "pages",
  "media",
  "templates",
  "navigation",
  "submissions",
  "users",
  "identity",
  "settings",
] as const

export type CmsModule = typeof modules[number]

export const itemStatus: Record<string, string> = {
  Draf: "draft",
  Terbit: "published",
  Dijadwalkan: "scheduled",
  Diarsipkan: "archived",
}

export const submissionStatus: Record<string, string> = {
  Baru: "new",
  Ditinjau: "reviewing",
  Diterima: "accepted",
  Ditolak: "rejected",
  "Daftar tunggu": "waiting_list",
  Diarsipkan: "archived",
}

export const editableFieldTypes = new Set([
  "text", "textarea", "richtext", "number", "boolean", "date", "datetime", "select", "multiselect", "url", "email", "phone",
  "media", "media_multiple", "relation", "json",
])
