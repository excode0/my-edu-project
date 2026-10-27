"use client"

import { CmsStudio } from "@/components/dashboard/cms/studio"
import { getContentBinding } from "@/lib/cms/content-bindings"
import { getContentFeaturePresentation } from "@/components/dashboard/cms/content-presentations"
import { CmsStaffEditor } from "./staff-editor"
import type { CmsData } from "@/types/type-cms-api"

const staffBinding = getContentBinding("staff")
const staffPresentation = getContentFeaturePresentation("staff")

export function StaffManagement({ permissions, initialData }: { permissions: string[]; initialData: CmsData }) {
  if (!staffBinding || !staffPresentation) return null

  return (
    <CmsStudio
      key="staff"
      initialData={initialData}
      permissions={permissions}
      initialModule="items"
      collectionSlug={staffBinding.collectionSlug}
      title={`Manajemen ${staffPresentation.label.toLocaleLowerCase("id")}`}
      description={staffPresentation.description}
      noun={staffPresentation.noun}
      titleField={staffBinding.titleField}
      summaryField={staffBinding.summaryField}
      requiredCollectionFields={staffBinding.requiredFields}
      renderItemEditor={({ collectionFields, mediaRecords, draft, onDraftChange, canUploadMedia, onUploaded }) => (
        <CmsStaffEditor feature={staffBinding} fields={collectionFields ?? []} media={mediaRecords} draft={draft} onDraftChange={onDraftChange} canUploadMedia={canUploadMedia} onUploaded={onUploaded} />
      )}
    />
  )
}
