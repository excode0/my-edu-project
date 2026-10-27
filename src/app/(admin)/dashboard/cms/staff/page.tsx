import { StaffManagement } from "@/components/dashboard/cms/staff/management"
import { requireCmsModuleAccess } from "@/lib/cms/server/pages/access"
import { getCmsData } from "@/lib/cms/server/data"

export default async function StaffPage() {
  const permissions = await requireCmsModuleAccess("items")
  const initialData = await getCmsData(permissions)
  return <StaffManagement initialData={initialData} permissions={permissions} />
}
