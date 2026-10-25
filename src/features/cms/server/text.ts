import { editableFieldTypes } from "./constants"
import { ApiError } from "./errors"

export function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 180) || "konten"
}

export function parseMetadata(value: string) {
  return Object.fromEntries(value.split(/[·;\n]/).flatMap((entry) => {
    const separator = entry.indexOf(":")
    if (separator < 1) return []
    return [[entry.slice(0, separator).trim().toLowerCase(), entry.slice(separator + 1).trim()]]
  }))
}

export function parseCollectionFields(value: string) {
  const tokens = value.split(",").map((token) => token.trim()).filter(Boolean)
  const definitions = tokens.map((token) => {
    const match = /^([a-z][a-z0-9_]{0,79})(?::([a-z_]+)(?:\[([^\]]*)\])?(!)?)?$/i.exec(token)
    if (!match) throw new ApiError("Gunakan format key:type, misalnya nama:text! atau kategori:select[Akademik|Prestasi].")
    const key = match[1].toLowerCase()
    const fieldType = (match[2] ?? "text").toLowerCase()
    const optionValues = match[3] === undefined ? null : match[3].split("|").map((option) => option.trim())
    const required = match[4] === "!"
    if (!/^[a-z][a-z0-9_]{0,79}$/.test(key) || !editableFieldTypes.has(fieldType)) {
      throw new ApiError("Tipe field tidak didukung. Gunakan format key:type.")
    }
    if ((fieldType === "select" || fieldType === "multiselect") && (
      !optionValues ||
      optionValues.length < 1 ||
      optionValues.length > 50 ||
      optionValues.some((option) => !option || option.length > 120 || /[,|[\]]/.test(option)) ||
      new Set(optionValues).size !== optionValues.length
    )) {
      throw new ApiError(`Field ${fieldType} membutuhkan 1-50 opsi unik (pisahkan dengan |).`)
    }
    if (optionValues && fieldType !== "select" && fieldType !== "multiselect") {
      throw new ApiError("Opsi hanya dapat digunakan dengan tipe select atau multiselect.")
    }
    return {
      key,
      fieldType,
      required,
      options: optionValues,
      label: key.replaceAll("_", " ").replace(/^./, (character) => character.toUpperCase()),
    }
  })
  if (new Set(definitions.map((field) => field.key)).size !== definitions.length) {
    throw new ApiError("Key field tidak boleh berulang.")
  }
  return definitions
}

export function normalizePagePath(value: string, title: string) {
  const parts = (value || title).split("/").filter(Boolean).map((part) => slugify(part))
  if (!parts.length) return "/"
  return `/${parts.join("/")}`.slice(0, 500)
}
