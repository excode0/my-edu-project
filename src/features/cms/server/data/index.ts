import { loadAudit } from "./audit"
import { loadIdentity, loadSettings } from "./identity"
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
import type { CmsData } from "./types"

export type { CmsData, CmsStatus, TemplateEditorConfig } from "./types"

export async function getCmsData(permissions: string[]): Promise<CmsData> {
  const [
    identity,
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
    loadIdentity(),
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
    identity: {
      name: identity?.nama_lembaga ?? "",
      shortName: identity?.nama_singkat ?? "",
      level: [identity?.jenjang, identity?.status_lembaga].filter(Boolean).join(" · "),
      accreditation: identity?.akreditasi ?? "",
      address: identity?.alamat ?? "",
      phone: identity?.telepon ?? "",
      email: identity?.email ?? "",
      vision: identity?.visi ?? "",
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
