import type { CollectionFieldSchema, ContentBinding } from "@/types/type-cms"

export function serializeCollectionFields(fields: CollectionFieldSchema[]) {
  return fields.map((field) => {
    const options = ["select", "multiselect"].includes(field.fieldType) && Array.isArray(field.options)
      ? `[${field.options.map(String).join("|")}]`
      : ""
    return `${field.key}:${field.fieldType}${options}${field.required ? "!" : ""}`
  }).join(", ")
}

export function collectionFieldSummary(fields: CollectionFieldSchema[] | undefined, limit = 4) {
  if (!fields?.length) return "Belum ada field"
  const labels = fields.slice(0, limit).map((field) => field.label).join(" · ")
  return `${fields.length} field · ${labels}${fields.length > limit ? " · …" : ""}`
}

export function createCollectionItemData(fields: CollectionFieldSchema[], excludedKeys: (string | undefined)[]) {
  const excluded = new Set(excludedKeys.filter((key): key is string => Boolean(key)))
  return Object.fromEntries(
    fields
      .filter((field) => !excluded.has(field.key))
      .map((field) => [field.key, field.defaultValue ?? (field.fieldType === "boolean" ? false : field.fieldType === "media_multiple" || field.fieldType === "multiselect" ? [] : "")]),
  )
}

export function resolveContentEditorFields(feature: ContentBinding, fields: CollectionFieldSchema[]) {
  const getField = (key?: string) => fields.find((field) => field.key === key)
  const roleKeys = new Set([feature.titleField, feature.summaryField, feature.bodyField, feature.categoryField, feature.dateField].filter(Boolean))
  return {
    title: getField(feature.titleField),
    summary: getField(feature.summaryField),
    body: getField(feature.bodyField),
    category: getField(feature.categoryField),
    date: getField(feature.dateField),
    additional: fields.filter((field) => !roleKeys.has(field.key)),
  }
}

