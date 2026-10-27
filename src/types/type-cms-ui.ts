import type { LucideIcon } from "lucide-react"
import type { CmsModuleEngineDefinition, ModuleKey } from "./type-cms"
import type { CmsRecord } from "./type-cms-api"

export type RecordDraft = Omit<CmsRecord, "id" | "updatedAt">

export type TemplateSlotDraft =
  | { source: "field"; key: string }
  | { source: "static"; value: string }

export type TemplateConfigDraft = {
  variant: string
  slots: Record<string, TemplateSlotDraft>
}

export type ModulePresentation = {
  key: ModuleKey
  label: string
  description: string
  icon: LucideIcon
  noun?: string
}

export type CmsModuleView = ModulePresentation & CmsModuleEngineDefinition

export type ContentFeaturePresentation = {
  key: string
  label: string
  noun?: string
  description: string
  route: string
}
