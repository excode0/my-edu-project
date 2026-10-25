import type { CmsStatus } from "@/types/type-cms"
import type { CmsRecord } from "@/types/type-cms-api"
import type { CmsRecordRow } from "@/types/type-cms-db"

export function formatStatus(status: string): CmsStatus {
  const statusLabels: Record<string, CmsStatus> = {
    draft: "Draf",
    published: "Terbit",
    scheduled: "Dijadwalkan",
    archived: "Diarsipkan",
    new: "Baru",
    reviewing: "Ditinjau",
    accepted: "Diterima",
    rejected: "Ditolak",
    waiting_list: "Daftar tunggu",
  }
  return statusLabels[status] ?? "Draf"
}

export function mapRecords(rows: CmsRecordRow[]): CmsRecord[] {
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description ?? "",
    fields: row.fields ?? "",
    status: formatStatus(row.status),
    updatedAt: new Date(row.updated_at).toISOString(),
    ...(row.collection_slug ? { collectionSlug: row.collection_slug } : {}),
    ...(row.collection_mode ? { collectionMode: row.collection_mode } : {}),
    ...(Array.isArray(row.collection_fields) ? { collectionFields: row.collection_fields as CmsRecord["collectionFields"] } : {}),
    ...(row.item_data && typeof row.item_data === "object" && !Array.isArray(row.item_data)
      ? { itemData: row.item_data as Record<string, unknown> }
      : {}),
  }))
}

export function displayValue(value: unknown) {
  if (value === null || value === undefined) return ""
  return typeof value === "string" ? value : JSON.stringify(value)
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
