import type { CmsModule } from "./constants"

export function getPermission(module: CmsModule, method: string, status?: string) {
  if (module === "settings") return "settings.manage"
  if (module === "users") return "user.manage"
  if (module === "submissions") return "submission.update"
  if (module === "navigation") return "menu.manage"
  if (module === "media") return "media.upload"
  if (module === "templates") return "template.config.manage"
  if (module === "collections") return "collection.fields.manage"
  if (module === "pages") return "pages.manage"
  if (module === "items" && method === "PATCH" && status === "Terbit") return "collection.items.publish"
  return "collection.items.create"
}
