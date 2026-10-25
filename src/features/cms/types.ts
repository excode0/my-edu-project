import type { CmsStatus, TemplateEditorConfig } from "./server/data/types"

export type { CmsStatus, TemplateEditorConfig }

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
export type Status = CmsStatus

export type CmsRecord = {
  id: string
  title: string
  slug: string
  description: string
  fields: string
  status: Status
  updatedAt: string
}

export type CmsData = {
  records: Record<RecordKey, CmsRecord[]>
  templateConfigs: TemplateEditorConfig[]
  identity: {
    name: string
    shortName: string
    level: string
    accreditation: string
    address: string
    phone: string
    email: string
    vision: string
  }
  settings: {
    siteTitle: string
    description: string
    admissionStatus: string
    admissionEnabled: boolean
  }
  audit: { id: string; title: string; description: string; updatedAt: string }[]
}

export type RecordDraft = Omit<CmsRecord, "id" | "updatedAt">

export type TemplateSlotDraft =
  | { source: "field"; key: string }
  | { source: "static"; value: string }

export type TemplateConfigDraft = {
  variant: string
  slots: Record<string, TemplateSlotDraft>
}

export type ModuleDefinition = {
  key: ModuleKey
  label: string
  description: string
  icon: typeof import("lucide-react").School
  recordKey?: RecordKey
  noun?: string
  permission?: string
}
