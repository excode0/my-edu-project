import "server-only"

import { loadAudit } from "./audit"
import { loadSettings } from "./settings"
import {
  loadCollections,
  loadItems,
  loadMedia,
  loadNavigation,
  loadPages,
  loadSubmissions,
  loadTemplates,
  loadUsers,
} from "./records"
import { displayValue } from "./shared"
import { loadTemplateConfigs } from "./template-configs"
import type { CmsData } from "@/types/type-cms-api"

export type { CmsData } from "@/types/type-cms-api"
export type { CmsStatus, TemplateEditorConfig } from "@/types/type-cms"

export async function getCmsData(permissions: string[]): Promise<CmsData> {
  const [
    settings,
    collections,
    items,
    pages,
    media,
    templates,
    templateConfigs,
    navigation,
    submissions,
    users,
    audit,
  ] = await Promise.all([
    loadSettings(),
    loadCollections(),
    loadItems(),
    loadPages(),
    loadMedia(),
    loadTemplates(),
    loadTemplateConfigs(),
    loadNavigation(),
    loadSubmissions(permissions),
    loadUsers(permissions),
    loadAudit(permissions),
  ])

  return {
    records: {
      collections,
      items,
      pages,
      media,
      templates,
      navigation,
      submissions,
      users,
    },
    settings: {
      siteTitle: displayValue(settings.get("general.site_title")),
      description: displayValue(settings.get("general.site_description")),
      admissionStatus: displayValue(settings.get("admissions.status")),
      admissionEnabled: settings.get("admissions.enabled") === true,
    },
    templateConfigs,
    audit,
  }
}
