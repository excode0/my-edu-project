import type { ReactNode } from "react"
import type { CollectionFieldSchema } from "@/types/type-cms"
import type { CmsRecord } from "@/types/type-cms-api"
import type { RecordDraft } from "@/types/type-cms-ui"

export type CmsItemEditorProps = {
  collectionFields?: CollectionFieldSchema[]
  mediaRecords: CmsRecord[]
  draft: RecordDraft
  onDraftChange: (updater: (current: RecordDraft) => RecordDraft) => void
  canUploadMedia: boolean
  onUploaded: () => Promise<void>
}

export type CmsItemEditor = (props: CmsItemEditorProps) => ReactNode
