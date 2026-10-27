import { z } from "zod"
import {
  getCollectionFieldTypeDefinition,
  isCollectionFieldType,
  normalizeCollectionFieldKeyInput,
  validateCollectionFieldKey,
} from "@/lib/cms/collection-field-types"
import { ApiError } from "./errors"
import { slugify } from "./text"

export type CollectionFieldDefinition = {
  key: string
  label: string
  fieldType: string
  required: boolean
  isUnique: boolean
  isListed: boolean
  isSearchable: boolean
  isFilterable: boolean
  options: string[] | null
  defaultValue: unknown
  validation: Record<string, unknown>
  helpText: string | null
}

export type CollectionFieldInput = {
  key: string
  label: string
  fieldType: string
  required?: boolean
  isUnique?: boolean
  isListed?: boolean
  isSearchable?: boolean
  isFilterable?: boolean
  options?: unknown
  defaultValue?: unknown
  validation?: Record<string, unknown>
  helpText?: string | null
}

const reservedPrefixes = new Set(["api", "dashboard", "login", "setup", "_next", "_vercel"])

function titleFromKey(key: string) {
  return key.replaceAll("_", " ").replace(/^./, (character) => character.toUpperCase())
}

function normalizeOptions(fieldType: string, value: unknown) {
  const definition = getCollectionFieldTypeDefinition(fieldType)
  if (!definition?.supportsOptions) {
    if (Array.isArray(value) && value.length) {
      throw new ApiError("Options hanya dapat digunakan dengan tipe select atau multiselect.")
    }
    return null
  }

  const rawOptions = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[|,\n]/)
      : []
  const options = rawOptions.map((option) => String(option).trim()).filter(Boolean)
  const normalizedOptions = options.map((option) => option.toLocaleLowerCase("en"))

  if (
    options.length < 1 ||
    options.length > 50 ||
    options.some((option) => option.length > 120 || /[,|[\]]/.test(option)) ||
    new Set(normalizedOptions).size !== normalizedOptions.length
  ) {
    throw new ApiError(`Options ${fieldType} membutuhkan 1-50 pilihan unik, tanpa koma, tanda |, atau kurung siku.`)
  }
  return options
}

function normalizeValidation(fieldType: string, value: Record<string, unknown> | undefined) {
  const definition = getCollectionFieldTypeDefinition(fieldType)
  if (!definition) throw new ApiError(`Tipe field "${fieldType}" tidak didukung.`)
  const rawValidation = value && typeof value === "object" && !Array.isArray(value) ? value : {}
  const minimum = rawValidation.min
  const maximum = rawValidation.max
  const hasMinimum = minimum !== undefined && minimum !== null && minimum !== ""
  const hasMaximum = maximum !== undefined && maximum !== null && maximum !== ""

  if ((hasMinimum || hasMaximum) && !definition?.supportsLength && !definition?.supportsRange) {
    throw new ApiError(`Validation min/max tidak didukung untuk tipe ${fieldType}.`)
  }

  const validation: Record<string, unknown> = {}
  if (hasMinimum) {
    const numericMinimum = Number(minimum)
    if (!Number.isFinite(numericMinimum)) throw new ApiError("Min value harus berupa angka.")
    if (definition.supportsLength && (!Number.isInteger(numericMinimum) || numericMinimum < 0)) {
      throw new ApiError("Min length harus berupa bilangan bulat 0 atau lebih.")
    }
    validation.min = numericMinimum
  }

  if (hasMaximum) {
    const numericMaximum = Number(maximum)
    if (!Number.isFinite(numericMaximum)) throw new ApiError("Max value harus berupa angka.")
    if (definition.supportsLength && (!Number.isInteger(numericMaximum) || numericMaximum < 0)) {
      throw new ApiError("Max length harus berupa bilangan bulat 0 atau lebih.")
    }
    validation.max = numericMaximum
  }

  if (typeof validation.min === "number" && typeof validation.max === "number" && validation.min > validation.max) {
    throw new ApiError("Min value tidak boleh lebih besar dari Max value.")
  }
  return validation
}

function normalizeDefaultValue(
  fieldType: string,
  value: unknown,
  options: string[] | null,
  validation: Record<string, unknown>,
) {
  const definition = getCollectionFieldTypeDefinition(fieldType)
  if (!definition) throw new ApiError(`Tipe field "${fieldType}" tidak didukung.`)
  if (value === undefined || value === null || value === "") return null
  if (!definition.supportsDefault) {
    throw new ApiError(`Default value tidak didukung untuk tipe ${fieldType}.`)
  }

  let normalizedValue: unknown = value
  if (fieldType === "boolean") {
    if (value === true || value === "true") normalizedValue = true
    else if (value === false || value === "false") normalizedValue = false
    else throw new ApiError("Default value boolean harus true atau false.")
  } else if (fieldType === "number") {
    const numericValue = Number(value)
    if (!Number.isFinite(numericValue)) throw new ApiError("Default value angka tidak valid.")
    normalizedValue = numericValue
  } else if (fieldType === "select") {
    const textValue = String(value).trim()
    if (!options?.includes(textValue)) throw new ApiError("Default value harus salah satu Options yang tersedia.")
    normalizedValue = textValue
  } else {
    if (typeof value !== "string") throw new ApiError("Default value harus berupa teks.")
    normalizedValue = value.trim()
    if (!normalizedValue) return null
  }

  const textValue = typeof normalizedValue === "string" ? normalizedValue : ""
  const minimum = typeof validation.min === "number" ? validation.min : undefined
  const maximum = typeof validation.max === "number" ? validation.max : undefined

  if (definition.supportsLength && typeof normalizedValue === "string") {
    if (minimum !== undefined && textValue.length < minimum) {
      throw new ApiError(`Default value minimal ${minimum} karakter.`)
    }
    if (maximum !== undefined && textValue.length > maximum) {
      throw new ApiError(`Default value maksimal ${maximum} karakter.`)
    }
  }
  if (definition.supportsRange && typeof normalizedValue === "number") {
    if (minimum !== undefined && normalizedValue < minimum) throw new ApiError(`Default value minimal ${minimum}.`)
    if (maximum !== undefined && normalizedValue > maximum) throw new ApiError(`Default value maksimal ${maximum}.`)
  }
  if (fieldType === "email" && !z.string().email().safeParse(normalizedValue).success) {
    throw new ApiError("Default value harus berupa email yang valid.")
  }
  if (fieldType === "url" && !z.string().url().safeParse(normalizedValue).success) {
    throw new ApiError("Default value harus berupa URL yang valid.")
  }
  if (fieldType === "date") {
    const dateValue = String(normalizedValue)
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(dateValue) ||
      Number.isNaN(new Date(`${dateValue}T00:00:00.000Z`).getTime()) ||
      new Date(`${dateValue}T00:00:00.000Z`).toISOString().slice(0, 10) !== dateValue
    ) {
      throw new ApiError("Default value tanggal harus memakai format YYYY-MM-DD.")
    }
  }
  if (fieldType === "datetime" && Number.isNaN(Date.parse(String(normalizedValue)))) {
    throw new ApiError("Default value tanggal dan waktu tidak valid.")
  }
  return normalizedValue
}

function normalizeField(field: CollectionFieldInput): CollectionFieldDefinition {
  const key = normalizeCollectionFieldKeyInput(field.key)
  const keyError = validateCollectionFieldKey(key)
  if (keyError) throw new ApiError(keyError)

  const fieldType = field.fieldType.trim().toLowerCase()
  if (!isCollectionFieldType(fieldType)) {
    throw new ApiError(`Tipe field "${fieldType}" tidak didukung.`)
  }
  const definition = getCollectionFieldTypeDefinition(fieldType)
  if (!definition) throw new ApiError(`Tipe field "${fieldType}" tidak didukung.`)

  const label = field.label.trim()
  if (!label) throw new ApiError(`Label field "${key}" wajib diisi.`)
  if (label.length > 120) throw new ApiError(`Label field "${key}" maksimal 120 karakter.`)

  if (field.isUnique === true && !definition.supportsUnique) {
    throw new ApiError(`Unique value tidak didukung untuk tipe ${fieldType}.`)
  }

  const options = normalizeOptions(fieldType, field.options)
  const validation = normalizeValidation(fieldType, field.validation)
  const defaultValue = normalizeDefaultValue(fieldType, field.defaultValue, options, validation)

  return {
    key,
    label,
    fieldType,
    required: field.required === true,
    isUnique: field.isUnique === true,
    isListed: field.isListed !== false,
    isSearchable: field.isSearchable === true,
    isFilterable: field.isFilterable === true,
    options,
    defaultValue,
    validation,
    helpText: field.helpText?.trim() || null,
  }
}

export function normalizeCollectionFields(fields: CollectionFieldInput[]) {
  if (fields.length > 80) throw new ApiError("Satu koleksi maksimal memiliki 80 field.")
  const definitions = fields.map(normalizeField)
  if (new Set(definitions.map((field) => field.key)).size !== definitions.length) {
    throw new ApiError("Field key tidak boleh berulang.")
  }
  return definitions
}

export function parseCollectionFields(value: string): CollectionFieldDefinition[] {
  const tokens = value.split(",").map((token) => token.trim()).filter(Boolean)
  return normalizeCollectionFields(tokens.map((token) => {
    const match = /^([a-z][a-z0-9_]{0,79})(?::([a-z_]+)(?:\[([^\]]*)\])?(!)?)?$/i.exec(token)
    if (!match) throw new ApiError("Gunakan format key:type, misalnya full_name:text! atau category:select[Akademik|Prestasi].")
    const key = match[1].toLowerCase()
    return {
      key,
      label: titleFromKey(key),
      fieldType: (match[2] ?? "text").toLowerCase(),
      required: match[4] === "!",
      options: match[3] === undefined ? null : match[3].split("|"),
      isListed: true,
    }
  }))
}

export function normalizeCollectionUrlPrefix(value: string | undefined, fallbackSlug: string) {
  const rawValue = value?.trim() || `/${fallbackSlug}`
  const parts = rawValue.split("/").map((part) => part.trim()).filter(Boolean)
  if (!parts.length) throw new ApiError("Alamat publik koleksi wajib diisi.")
  if (parts.some((part) => !/[a-z0-9]/i.test(part))) {
    throw new ApiError("Alamat publik hanya boleh berisi huruf, angka, dan tanda hubung.")
  }

  const normalized = `/${parts.map((part) => slugify(part)).join("/")}`
  if (normalized.length > 80) throw new ApiError("Alamat publik koleksi maksimal 80 karakter.")
  if (normalized === "/") throw new ApiError("Alamat publik koleksi tidak boleh berada di root.")
  if (reservedPrefixes.has(normalized.slice(1).split("/")[0] ?? "")) {
    throw new ApiError("Alamat publik tersebut dipakai sistem. Gunakan prefix lain.")
  }
  return normalized
}
