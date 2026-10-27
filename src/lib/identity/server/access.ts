import "server-only"

import { redirect } from "next/navigation"
import { hasPermission } from "@/lib/auth/permissions"
import { requireUser } from "@/lib/auth/server/auth"

export async function requireIdentityAccess() {
  const user = await requireUser()

  if (
    !hasPermission(user.permissions, "dashboard.view") ||
    !hasPermission(user.permissions, "identitas.update")
  ) {
    redirect("/dashboard")
  }

  return user
}
