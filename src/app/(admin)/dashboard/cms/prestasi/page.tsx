import { ProfileCollectionManagement } from "@/components/dashboard/cms/profile/management"
import { requireCmsModuleAccess } from "@/lib/cms/server/pages/access"
import { getCmsData } from "@/lib/cms/server/data"

export default async function AchievementPage() {
  const permissions = await requireCmsModuleAccess("items")
  const initialData = await getCmsData(permissions)
  return <ProfileCollectionManagement featureKey="achievement" initialData={initialData} permissions={permissions} />
}
