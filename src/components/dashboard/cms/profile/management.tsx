"use client"

import { CmsStudio } from "@/components/dashboard/cms/studio"
import { getContentBinding } from "@/lib/cms/content-bindings"
import { getContentFeaturePresentation } from "@/components/dashboard/cms/content-presentations"
import { CmsProfileEditor } from "./profile-editor"
import type { CmsData } from "@/types/type-cms-api"

export function ProfileCollectionManagement({
  featureKey,
  permissions,
  initialData,
}: {
  featureKey: string
  permissions: string[]
  initialData: CmsData
}) {
  const binding = getContentBinding(featureKey)
  const presentation = getContentFeaturePresentation(featureKey)
  if (!binding || !presentation) return null

  return (
    <CmsStudio
      key={featureKey}
      initialData={initialData}
      permissions={permissions}
      initialModule="items"
      collectionSlug={binding.collectionSlug}
      title={`Manajemen ${presentation.label.toLocaleLowerCase("id")}`}
      description={presentation.description}
      noun={presentation.noun}
      titleField={binding.titleField}
      summaryField={binding.summaryField}
      requiredCollectionFields={binding.requiredFields}
      renderItemEditor={({ collectionFields, mediaRecords, draft, onDraftChange, canUploadMedia, onUploaded }) => (
        <CmsProfileEditor feature={binding} fields={collectionFields ?? []} media={mediaRecords} draft={draft} onDraftChange={onDraftChange} canUploadMedia={canUploadMedia} onUploaded={onUploaded} />
      )}
    />
  )
}
