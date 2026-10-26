"use client"

import { CmsStudio } from "@/components/dashboard/cms/studio"
import { getContentBinding } from "@/lib/cms/content-bindings"
import { getContentFeaturePresentation } from "@/components/dashboard/cms/content-presentations"
import { CmsNewsEditor } from "./article-editor"
import type { CmsData } from "@/types/type-cms-api"

const newsBinding = getContentBinding("news")
const newsPresentation = getContentFeaturePresentation("news")

export function NewsManagement({ permissions, initialData }: { permissions: string[]; initialData: CmsData }) {
  if (!newsBinding || !newsPresentation) return null

  return (
    <CmsStudio
      key="news"
      initialData={initialData}
      permissions={permissions}
      initialModule="items"
      collectionSlug={newsBinding.collectionSlug}
      title={`Manajemen ${newsPresentation.label.toLocaleLowerCase("id")}`}
      description={newsPresentation.description}
      noun={newsPresentation.noun}
      titleField={newsBinding.titleField}
      summaryField={newsBinding.summaryField}
      requiredCollectionFields={newsBinding.requiredFields}
      renderItemEditor={({ collectionFields, mediaRecords, draft, onDraftChange, canUploadMedia, onUploaded }) => (
        <CmsNewsEditor feature={newsBinding} fields={collectionFields ?? []} media={mediaRecords} draft={draft} onDraftChange={onDraftChange} canUploadMedia={canUploadMedia} onUploaded={onUploaded} />
      )}
    />
  )
}
