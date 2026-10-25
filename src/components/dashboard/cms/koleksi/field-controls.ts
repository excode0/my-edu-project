import type { CollectionFieldSchema } from "@/types/type-cms"
import type { CmsRecord } from "@/types/type-cms-api"

export type CollectionFieldControl =
  | "checkbox" | "select" | "multiselect" | "media" | "media-multiple"
  | "textarea" | "number" | "date" | "datetime" | "email" | "url" | "tel" | "text"

export function getCollectionFieldControl(field: CollectionFieldSchema): CollectionFieldControl {
  switch (field.fieldType) {
    case "boolean": return "checkbox"
    case "select": return "select"
    case "multiselect": return "multiselect"
    case "media": return "media"
    case "media_multiple": return "media-multiple"
    case "textarea":
    case "richtext":
    case "json": return "textarea"
    case "number": return "number"
    case "date": return "date"
    case "datetime": return "datetime"
    case "email": return "email"
    case "url": return "url"
    case "phone": return "tel"
    default: return "text"
  }
}

export function getCollectionFieldOptions(field: CollectionFieldSchema) {
  return Array.isArray(field.options) ? field.options.map(String) : []
}

export function getCollectionFieldInputValue(field: CollectionFieldSchema, value: unknown): string | string[] {
  if (field.fieldType === "multiselect" || field.fieldType === "media_multiple") {
    return Array.isArray(value) ? value.map(String) : []
  }
  if (value == null) return ""
  if (typeof value === "string") return field.fieldType === "datetime" ? value.slice(0, 16) : value
  return String(value)
}

export function parseCollectionFieldInput(field: CollectionFieldSchema, value: string | string[] | boolean): unknown {
  if (field.fieldType === "number" && typeof value === "string" && value !== "") return Number(value)
  return value
}

export function selectMediaRecord(media: CmsRecord[], value: unknown) {
  return media.find((item) => item.id === value)
}
