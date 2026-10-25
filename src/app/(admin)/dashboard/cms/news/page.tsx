import { NewsManagement } from "@/components/dashboard/cms/news/management"
import { requireCmsModuleAccess } from "@/lib/cms/server/pages/access"
import { getCmsData } from "@/lib/cms/server/data"

export default async function NewsPage() {
  const permissions = await requireCmsModuleAccess("items")
  const initialData = await getCmsData(permissions)
  return <NewsManagement initialData={initialData} permissions={permissions} />
}
