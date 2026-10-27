export const collectionFieldTypeValues = [
  "text",
  "textarea",
  "richtext",
  "number",
  "boolean",
  "date",
  "datetime",
  "select",
  "multiselect",
  "url",
  "email",
  "phone",
  "media",
  "media_multiple",
  "relation",
  "json",
] as const

export type CollectionFieldType = typeof collectionFieldTypeValues[number]

export type CollectionFieldTypeDefinition = {
  value: CollectionFieldType
  label: string
  description: string
  supportsOptions: boolean
  supportsUnique: boolean
  supportsLength: boolean
  supportsRange: boolean
  supportsDefault: boolean
}

export const collectionFieldTypeDefinitions: Record<CollectionFieldType, CollectionFieldTypeDefinition> = {
  text: {
    value: "text",
    label: "Teks singkat",
    description: "Satu baris teks pendek seperti nama, kode, atau judul singkat.",
    supportsOptions: false,
    supportsUnique: true,
    supportsLength: true,
    supportsRange: false,
    supportsDefault: true,
  },
  textarea: {
    value: "textarea",
    label: "Teks panjang",
    description: "Teks beberapa baris untuk catatan atau ringkasan.",
    supportsOptions: false,
    supportsUnique: true,
    supportsLength: true,
    supportsRange: false,
    supportsDefault: true,
  },
  richtext: {
    value: "richtext",
    label: "Teks berformat",
    description: "Konten HTML kaya untuk artikel atau deskripsi panjang.",
    supportsOptions: false,
    supportsUnique: false,
    supportsLength: false,
    supportsRange: false,
    supportsDefault: false,
  },
  number: {
    value: "number",
    label: "Angka",
    description: "Nilai numerik, termasuk desimal dan angka negatif.",
    supportsOptions: false,
    supportsUnique: true,
    supportsLength: false,
    supportsRange: true,
    supportsDefault: true,
  },
  boolean: {
    value: "boolean",
    label: "Ya / tidak",
    description: "Nilai benar atau salah, ditampilkan sebagai checkbox.",
    supportsOptions: false,
    supportsUnique: false,
    supportsLength: false,
    supportsRange: false,
    supportsDefault: true,
  },
  date: {
    value: "date",
    label: "Tanggal",
    description: "Tanggal tanpa jam dengan format YYYY-MM-DD.",
    supportsOptions: false,
    supportsUnique: true,
    supportsLength: false,
    supportsRange: false,
    supportsDefault: true,
  },
  datetime: {
    value: "datetime",
    label: "Tanggal dan waktu",
    description: "Tanggal dan waktu dalam format ISO atau datetime-local.",
    supportsOptions: false,
    supportsUnique: true,
    supportsLength: false,
    supportsRange: false,
    supportsDefault: true,
  },
  select: {
    value: "select",
    label: "Pilihan tunggal",
    description: "Satu nilai dari daftar opsi yang ditentukan.",
    supportsOptions: true,
    supportsUnique: true,
    supportsLength: false,
    supportsRange: false,
    supportsDefault: true,
  },
  multiselect: {
    value: "multiselect",
    label: "Pilihan ganda",
    description: "Beberapa nilai dari daftar opsi yang ditentukan.",
    supportsOptions: true,
    supportsUnique: false,
    supportsLength: false,
    supportsRange: false,
    supportsDefault: false,
  },
  url: {
    value: "url",
    label: "URL",
    description: "Alamat web lengkap, misalnya https://contoh.sch.id.",
    supportsOptions: false,
    supportsUnique: true,
    supportsLength: true,
    supportsRange: false,
    supportsDefault: true,
  },
  email: {
    value: "email",
    label: "Email",
    description: "Alamat email yang valid.",
    supportsOptions: false,
    supportsUnique: true,
    supportsLength: true,
    supportsRange: false,
    supportsDefault: true,
  },
  phone: {
    value: "phone",
    label: "Telepon",
    description: "Nomor telepon atau WhatsApp.",
    supportsOptions: false,
    supportsUnique: true,
    supportsLength: true,
    supportsRange: false,
    supportsDefault: true,
  },
  media: {
    value: "media",
    label: "Satu media",
    description: "Satu referensi media dari pustaka media.",
    supportsOptions: false,
    supportsUnique: false,
    supportsLength: false,
    supportsRange: false,
    supportsDefault: false,
  },
  media_multiple: {
    value: "media_multiple",
    label: "Beberapa media",
    description: "Beberapa referensi media dari pustaka media.",
    supportsOptions: false,
    supportsUnique: false,
    supportsLength: false,
    supportsRange: false,
    supportsDefault: false,
  },
  relation: {
    value: "relation",
    label: "Relasi data",
    description: "Referensi ke pengguna atau item koleksi lain melalui UUID.",
    supportsOptions: false,
    supportsUnique: true,
    supportsLength: false,
    supportsRange: false,
    supportsDefault: false,
  },
  json: {
    value: "json",
    label: "JSON",
    description: "Objek JSON bebas untuk data terstruktur tambahan.",
    supportsOptions: false,
    supportsUnique: false,
    supportsLength: false,
    supportsRange: false,
    supportsDefault: false,
  },
}

export const collectionFieldTypeOptions = collectionFieldTypeValues.map((value) => collectionFieldTypeDefinitions[value])

export const collectionFieldTypeSet: ReadonlySet<string> = new Set(collectionFieldTypeValues)

export function isCollectionFieldType(value: string): value is CollectionFieldType {
  return collectionFieldTypeSet.has(value)
}

export function getCollectionFieldTypeDefinition(value: string): CollectionFieldTypeDefinition | undefined {
  return isCollectionFieldType(value) ? collectionFieldTypeDefinitions[value] : undefined
}

export const collectionFieldKeyPattern = /^[a-z][a-z0-9_]{0,79}$/

export const reservedCollectionFieldKeys = new Set([
  "id",
  "slug",
  "status",
  "collection_slug",
  "created_at",
  "updated_at",
])

export function normalizeCollectionFieldKeyInput(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+/, "")
    .slice(0, 80)
}

export function collectionFieldKeyFromLabel(label: string) {
  const base = normalizeCollectionFieldKeyInput(label).replace(/_+$/, "")
  if (!base) return "new_field"
  return /^[a-z]/.test(base) ? base : `field_${base}`.slice(0, 80)
}

export function validateCollectionFieldKey(key: string) {
  const normalized = key.trim()
  if (!normalized) return "Field key wajib diisi."
  if (normalized.length > 80) return "Field key maksimal 80 karakter."
  if (!collectionFieldKeyPattern.test(normalized)) {
    return "Field key harus dimulai huruf kecil dan hanya memakai huruf, angka, atau underscore."
  }
  if (reservedCollectionFieldKeys.has(normalized)) {
    return `Field key "${normalized}" dipakai sistem. Gunakan key lain.`
  }
  return null
}
