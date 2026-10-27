import type { CmsModuleEngineDefinition, ModuleKey } from "@/types/type-cms"

export const cmsModuleEngine: Record<ModuleKey, CmsModuleEngineDefinition> = {
  overview: { key: "overview" },
  collections: { key: "collections", recordKey: "collections", permission: "collection.fields.manage", managePermission: "collection.fields.manage", canCreateRecord: true },
  items: { key: "items", recordKey: "items", permission: "collection.items.create", managePermission: "collection.items.create", canCreateRecord: true },
  pages: { key: "pages", recordKey: "pages", permission: "pages.manage", managePermission: "pages.manage", canCreateRecord: true },
  media: { key: "media", recordKey: "media", permission: "media.upload", managePermission: "media.upload" },
  templates: { key: "templates", recordKey: "templates", permission: "template.view", managePermission: "template.config.manage" },
  navigation: { key: "navigation", recordKey: "navigation", permission: "menu.manage", managePermission: "menu.manage", canCreateRecord: true },
  submissions: { key: "submissions", recordKey: "submissions", permission: "submission.view", managePermission: "submission.update" },
  users: { key: "users", recordKey: "users", permission: "user.manage", managePermission: "user.manage", canCreateRecord: true },
  settings: { key: "settings", permission: "settings.manage", managePermission: "settings.manage" },
  audit: { key: "audit", permission: "audit.view" },
}

export function findCmsModuleEngineDefinition(key: string) {
  return Object.hasOwn(cmsModuleEngine, key)
    ? cmsModuleEngine[key as ModuleKey]
    : undefined
}
