import { CmsStudio } from "../cms-studio"
import { requireUser } from "@/lib/auth"

export default async function CmsPage() {
  const user = await requireUser()
  return <CmsStudio permissions={user.permissions} />
}
