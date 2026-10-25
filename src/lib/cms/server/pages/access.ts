import "server-only"

import { redirect } from "next/navigation"
import { hasPermission } from "@/lib/auth/permissions"
import { requireUser } from "@/lib/auth/server/auth"
import { findCmsModuleEngineDefinition } from "@/lib/cms/module-engine"
import type { ModuleKey } from "@/types/type-cms"

export async function requireCmsModuleAccess(module: ModuleKey) {
  const user = await requireUser()
  const definition = findCmsModuleEngineDefinition(module)

  if (!hasPermission(user.permissions, "dashboard.view")) {
    redirect("/dashboard")
  }

  if (definition?.permission && !hasPermission(user.permissions, definition.permission)) {
    redirect("/dashboard")
  }

  return user.permissions
}
