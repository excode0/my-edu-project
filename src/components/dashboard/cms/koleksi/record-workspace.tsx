"use client"

import { Search } from "lucide-react"
import { statusOptions } from "@/components/dashboard/cms/presentation"
import { CmsRecordForm } from "./record-form"
import { CmsRecordTable } from "./record-table"
import { MediaUploader } from "@/components/dashboard/cms/media/media-uploader"
import type { CmsItemEditor } from "./record-editor"
import type {
  CollectionFieldSchema,
  ModuleKey,
} from "@/types/type-cms"
import type { CmsData, CmsRecord } from "@/types/type-cms-api"
import type { CmsModuleView } from "@/types/type-cms-ui"
import type { RecordDraft, TemplateConfigDraft, TemplateSlotDraft } from "@/types/type-cms-ui"

type CmsRecordWorkspaceProps = {
  active: ModuleKey
  module: CmsModuleView
  data: CmsData
  collectionFields?: CollectionFieldSchema[]
  titleField?: string
  summaryField?: string
  renderItemEditor?: CmsItemEditor
  canManage: boolean
  canPublish: boolean
  canUploadMedia: boolean
  records: CmsRecord[]
  visibleRecords: CmsRecord[]
  query: string
  onQueryChange: (value: string) => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  editingId: string | null
  draft: RecordDraft
  onDraftChange: (updater: (current: RecordDraft) => RecordDraft) => void
  userPassword: string
  onUserPasswordChange: (value: string) => void
  templateConfigDraft: TemplateConfigDraft | null
  onChangeTemplateVariant: (variant: string) => void
  onChangeTemplateSlot: (slotKey: string, value: TemplateSlotDraft) => void
  onSave: (event: React.FormEvent<HTMLFormElement>) => void
  onEdit: (record: CmsRecord) => void
  onToggleStatus: (record: CmsRecord) => void
  onDelete: (record: CmsRecord) => void
  onCloseEditor: () => void
  onUploaded: () => Promise<void>
}

export function CmsRecordWorkspace(props: CmsRecordWorkspaceProps) {
  const {
    active,
    module,
    data,
    collectionFields,
    titleField,
    summaryField,
    renderItemEditor,
    canManage,
    canPublish,
    canUploadMedia,
    records,
    visibleRecords,
    query,
    onQueryChange,
    statusFilter,
    onStatusFilterChange,
    editingId,
    draft,
    onDraftChange,
    userPassword,
    onUserPasswordChange,
    templateConfigDraft,
    onChangeTemplateVariant,
    onChangeTemplateSlot,
    onSave,
    onEdit,
    onToggleStatus,
    onDelete,
    onCloseEditor,
    onUploaded,
  } = props

  const template = active === "templates"
    ? data.templateConfigs.find((config) => config.templateId === editingId)
    : undefined

  return (
    <div>
      {active === "media" && <MediaUploader onUploaded={onUploaded} />}
      {active === "templates" && <div className="mb-4 rounded-lg border border-sky-100 bg-sky-50 px-3 py-2.5 text-xs leading-relaxed text-sky-800">Template yang tampil berasal dari registry kode; binding tersimpan dan diperiksa di database.</div>}
      {active === "users" && <div className="mb-4 rounded-lg border border-violet-100 bg-violet-50 px-3 py-2.5 text-xs leading-relaxed text-violet-800">Password disimpan sebagai hash scrypt dan izin selalu diperiksa di server.</div>}
      {active === "submissions" && <div className="mb-4 rounded-lg border border-sky-100 bg-sky-50 px-3 py-2.5 text-xs leading-relaxed text-sky-800">Data pendaftar tersimpan di database dan ditampilkan hanya bagi role berizin.</div>}
      <div className="mb-4 flex flex-wrap gap-2">
        <label className="relative min-w-[220px] flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input aria-label={`Cari ${module.noun}`} placeholder={`Cari ${module.noun}...`} value={query} onChange={(event) => onQueryChange(event.target.value)} className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" /></label>
        <select aria-label="Filter status" value={statusFilter} onChange={(event) => onStatusFilterChange(event.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-600 outline-none focus:border-violet-400"><option>Semua status</option>{statusOptions(active).map((status) => <option key={status}>{status}</option>)}</select>
      </div>

      {editingId !== null && canManage && (
        <CmsRecordForm
          active={active}
          noun={module.noun}
          collectionFields={collectionFields}
          titleField={titleField}
          summaryField={summaryField}
          renderItemEditor={renderItemEditor}
          canUploadMedia={canUploadMedia}
          mediaRecords={data.records.media}
          editingId={editingId}
          draft={draft}
          onDraftChange={onDraftChange}
          userPassword={userPassword}
          onUserPasswordChange={onUserPasswordChange}
          templateConfigDraft={templateConfigDraft}
          template={template}
          onChangeTemplateVariant={onChangeTemplateVariant}
          onChangeTemplateSlot={onChangeTemplateSlot}
          onSave={onSave}
          onClose={onCloseEditor}
          onUploaded={onUploaded}
        />
      )}

      <CmsRecordTable
        active={active}
        noun={module.noun}
        records={records}
        visibleRecords={visibleRecords}
        canManage={canManage}
        canPublish={canPublish}
        onEdit={onEdit}
        onToggleStatus={onToggleStatus}
        onDelete={onDelete}
      />
    </div>
  )
}
