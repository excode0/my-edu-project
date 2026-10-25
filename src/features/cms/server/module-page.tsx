import { redirect } from "next/navigation"
import { requireUser } from "@/features/auth/server/auth"
import { CmsStudio } from "../components/cms-studio"
import { modules } from "../lib/modules"
import type { ModuleKey } from "../types"

export async function CmsModulePage({ module }: { module: ModuleKey }) {
  const user = await requireUser()
  const definition = modules.find((entry) => entry.key === module)

  if (definition?.permission && !user.permissions.includes(definition.permission)) {
    redirect("/dashboard")
  }

  return <CmsStudio permissions={user.permissions} initialModule={module} />
}
