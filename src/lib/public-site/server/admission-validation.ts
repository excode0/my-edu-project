import sanitizeHtml from "sanitize-html"
import { z } from "zod"
import type { SubmissionField, SubmissionValidation } from "@/types/type-public-site"

export function validateSubmission(
  data: Record<string, string | string[]>,
  fields: SubmissionField[],
): SubmissionValidation {
  const allowedKeys = new Set(fields.map((field) => field.key))
  if (Object.keys(data).some((key) => !allowedKeys.has(key))) {
    return { error: "Ada isian formulir yang tidak dikenal." }
  }

  const normalized: Record<string, string | string[]> = {}
  for (const field of fields) {
    const rawValue = data[field.key] ?? (field.field_type === "multiselect" ? [] : "")
    if ((field.field_type === "multiselect") !== Array.isArray(rawValue)) {
      return { error: `Format isian ${field.label} tidak valid.` }
    }
    let value: string | string[] = Array.isArray(rawValue)
      ? [...new Set(rawValue.map((entry) => entry
          .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
          .trim()
          .replace(/\s+/g, " ")
        ).filter(Boolean))]
      : rawValue
          .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
          .trim()
          .replace(/\s+/g, " ")
    if (field.is_required && (
      !value.length ||
      (field.field_type === "boolean" && value !== "true")
    )) {
      return { error: `Isian ${field.label} wajib diisi.` }
    }
    const configuredMax = Number(field.validation.max)
    const maxLength = Number.isInteger(configuredMax) && configuredMax > 0
      ? Math.min(configuredMax, 2_000)
      : 2_000
    const values = Array.isArray(value) ? value : [value]
    if (values.some((entry) => entry.length > maxLength)) {
      return { error: `Isian ${field.label} terlalu panjang.` }
    }

    if (typeof value === "string" && value && field.field_type === "email" && !z.email().safeParse(value).success) {
      return { error: `Format ${field.label} tidak valid.` }
    }
    if (typeof value === "string" && value && field.field_type === "phone" && !/^[+()\d][+()\d\s.-]{5,29}$/.test(value)) {
      return { error: `Format ${field.label} tidak valid.` }
    }
    if (typeof value === "string" && value && field.field_type === "number" && !Number.isFinite(Number(value))) {
      return { error: `Isian ${field.label} harus berupa angka.` }
    }
    if (typeof value === "string" && value && field.field_type === "boolean" && value !== "true" && value !== "false") {
      return { error: `Isian ${field.label} tidak valid.` }
    }
    if (typeof value === "string" && value && field.field_type === "url" && !z.url().safeParse(value).success) {
      return { error: `Format ${field.label} tidak valid.` }
    }
    if (typeof value === "string" && value && field.field_type === "datetime" && Number.isNaN(Date.parse(value))) {
      return { error: `Format ${field.label} tidak valid.` }
    }
    if (typeof value === "string" && value && field.field_type === "date") {
      const parsedDate = new Date(`${value}T00:00:00.000Z`)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== value) {
        return { error: `Format ${field.label} tidak valid.` }
      }
    }
    if (value.length && (field.field_type === "select" || field.field_type === "multiselect")) {
      const options = Array.isArray(field.options) ? field.options.map(String) : []
      if (values.some((entry) => !options.includes(entry))) return { error: `Pilihan ${field.label} tidak valid.` }
    }
    if (typeof value === "string" && field.field_type === "richtext" && value) {
      value = sanitizeHtml(value, {
        allowedTags: ["p", "br", "strong", "em", "ul", "ol", "li"],
        allowedAttributes: {},
      })
    }
    normalized[field.key] = value
  }

  const email = normalized.email
  if (typeof email !== "string" || !email || email.length > 180 || !z.email().safeParse(email).success) {
    return { error: "Email orang tua/wali wajib diisi dengan format yang valid." }
  }
  const phone = normalized.telepon
  if (typeof phone === "string" && phone && (phone.length > 30 || !/^[+()\d][+()\d\s.-]{5,29}$/.test(phone))) {
    return { error: "Nomor telepon tidak valid." }
  }
  return { data: normalized, email }
}
