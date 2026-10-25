import { requirePermission } from "@/lib/auth/server/auth"
import { getCmsData } from "@/lib/cms/server/data"
import type { CmsData } from "@/types/type-cms-api"

export async function getCmsRecords() {
  const authorization = await requirePermission("dashboard.view")
  if (authorization.response || !authorization.user) return authorization.response

  try {
    const data: CmsData = await getCmsData(authorization.user.permissions)
    return Response.json(data, { headers: { "Cache-Control": "private, no-store" } })
  } catch (error) {
    console.error("CMS data read failed.", error)
    return Response.json({ error: "Data CMS tidak dapat dimuat. Periksa koneksi database." }, { status: 500 })
  }
}
