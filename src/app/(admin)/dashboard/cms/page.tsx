import { redirect } from "next/navigation"
import { requireUser } from "@/features/auth/server/auth"
import { modules } from "@/features/cms/lib/modules"

export default async function CmsPage() {
  const user = await requireUser()
  const firstAccessible = modules.find(
    (module) => module.key !== "overview" && (!module.permission || user.permissions.includes(module.permission)),
  )

  redirect(firstAccessible ? `/dashboard/cms/${firstAccessible.key}` : "/dashboard")
}
