export const modules = [
  "collections",
  "items",
  "pages",
  "media",
  "templates",
  "navigation",
  "submissions",
  "users",
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

export { collectionFieldTypeSet as editableFieldTypes } from "@/lib/cms/collection-field-types"
