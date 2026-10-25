export type CmsStatus =
  | "Draf"
  | "Terbit"
  | "Dijadwalkan"
  | "Diarsipkan"
  | "Baru"
  | "Ditinjau"
  | "Diterima"
  | "Ditolak"
  | "Daftar tunggu"

export type Status = CmsStatus

export type ModuleKey =
  | "overview"
  | "identity"
  | "collections"
  | "items"
  | "pages"
  | "media"
  | "templates"
  | "navigation"
  | "submissions"
  | "users"
  | "settings"
  | "audit"

export type RecordKey = Exclude<ModuleKey, "overview" | "identity" | "settings" | "audit">

export type CollectionFieldSchema = {
  key: string
  label: string
  fieldType: string
  required: boolean
  options: unknown
  defaultValue: unknown
  helpText: string
  validation: Record<string, unknown>
}

export type TemplateEditorConfig = {
  templateId: string
  configId: string | null
  variant: string
  availableVariants: string[]
  scope: string
  collectionSlug: string
  slots: { key: string; type: string; required: boolean }[]
  bindings: Record<string, { source: "field"; key: string } | { source: "static"; value: unknown }>
  bindingStatuses: Record<string, string>
  fields: { key: string; label: string; type: string }[]
}

export type CmsModuleEngineDefinition = {
  key: ModuleKey
  recordKey?: RecordKey
  permission?: string
  managePermission?: string
  canCreateRecord?: boolean
}

export type ContentBinding = {
  key: string
  collectionSlug: string
  permission: string
  titleField: string
  summaryField?: string
  bodyField?: string
  categoryField?: string
  dateField?: string
  requiredFields: string[]
}
