import {
  getCollectionFieldTypeDefinition,
  validateCollectionFieldKey,
} from "@/lib/cms/collection-field-types"
import type { CollectionFieldSchema } from "@/types/type-cms"

function normalizeOption(option: string) {
  return option.trim().toLocaleLowerCase("en")
}

export function getCollectionFieldIssues(field: CollectionFieldSchema, fields: CollectionFieldSchema[]) {
  const issues: string[] = []
  const keyError = validateCollectionFieldKey(field.key)
  if (keyError) issues.push(keyError)
  else if (fields.filter((candidate) => candidate.key === field.key).length > 1) {
    issues.push(`Field key "${field.key}" dipakai lebih dari satu field.`)
  }

  if (!field.label.trim()) issues.push("Field label wajib diisi.")
  else if (field.label.trim().length > 120) issues.push("Field label maksimal 120 karakter.")

  const definition = getCollectionFieldTypeDefinition(field.fieldType)
  if (!definition) {
    issues.push("Data type tidak didukung.")
    return issues
  }

  const validation = field.validation ?? {}
  const minimum = typeof validation.min === "number" ? validation.min : undefined
  const maximum = typeof validation.max === "number" ? validation.max : undefined

  if (definition.supportsOptions) {
    const options = Array.isArray(field.options) ? field.options.map(String).map((option) => option.trim()).filter(Boolean) : []
    const normalizedOptions = options.map(normalizeOption)
    if (!options.length) issues.push("Options wajib diisi minimal satu pilihan.")
    if (options.length > 50) issues.push("Options maksimal 50 pilihan.")
    if (options.some((option) => option.length > 120)) issues.push("Setiap option maksimal 120 karakter.")
    if (new Set(normalizedOptions).size !== normalizedOptions.length) issues.push("Options tidak boleh memiliki pilihan yang sama.")
  }

  if (definition.supportsLength) {
    if (minimum !== undefined && (!Number.isInteger(minimum) || minimum < 0)) issues.push("Min length harus bilangan bulat 0 atau lebih.")
    if (maximum !== undefined && (!Number.isInteger(maximum) || maximum < 0)) issues.push("Max length harus bilangan bulat 0 atau lebih.")
  }
  if ((minimum !== undefined || maximum !== undefined) && !definition.supportsLength && !definition.supportsRange) {
    issues.push("Validation min/max tidak didukung untuk tipe ini.")
  }
  if (minimum !== undefined && maximum !== undefined && minimum > maximum) {
    issues.push("Min value tidak boleh lebih besar dari Max value.")
  }

  if (field.defaultValue !== undefined && field.defaultValue !== null && field.defaultValue !== "") {
    if (!definition.supportsDefault) {
      issues.push("Default value tidak didukung untuk tipe ini.")
    } else if (field.fieldType === "select" && !(Array.isArray(field.options) ? field.options.map(String) : []).includes(String(field.defaultValue))) {
      issues.push("Default value harus salah satu Options yang tersedia.")
    } else if (definition.supportsLength && typeof field.defaultValue === "string") {
      if (minimum !== undefined && field.defaultValue.length < minimum) issues.push(`Default value minimal ${minimum} karakter.`)
      if (maximum !== undefined && field.defaultValue.length > maximum) issues.push(`Default value maksimal ${maximum} karakter.`)
    } else if (definition.supportsRange && typeof field.defaultValue === "number") {
      if (minimum !== undefined && field.defaultValue < minimum) issues.push(`Default value minimal ${minimum}.`)
      if (maximum !== undefined && field.defaultValue > maximum) issues.push(`Default value maksimal ${maximum}.`)
    }
  }

  return issues
}
