import { requireCmsModuleAccess } from "@/lib/cms/server/pages/access"
import { getCmsData } from "@/lib/cms/server/data"
import type { ModuleKey } from "@/types/type-cms"
import { CmsStudio } from "./studio"

export async function CmsModulePage({ module, collectionSlug, title, description, noun, titleField, summaryField, requiredCollectionFields }: { module: ModuleKey; collectionSlug?: string; title?: string; description?: string; noun?: string; titleField?: string; summaryField?: string; requiredCollectionFields?: string[] }) {
  const permissions = await requireCmsModuleAccess(module)
  const initialData = await getCmsData(permissions)

  return <CmsStudio key={module} initialData={initialData} permissions={permissions} initialModule={module} collectionSlug={collectionSlug} title={title} description={description} noun={noun} titleField={titleField} summaryField={summaryField} requiredCollectionFields={requiredCollectionFields} />
}
