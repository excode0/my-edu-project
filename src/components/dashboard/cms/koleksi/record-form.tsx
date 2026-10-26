import { Check, X } from "lucide-react"
import { inputClassName, statusOptions } from "@/components/dashboard/cms/presentation"
import { CmsTemplateConfigEditor } from "@/components/dashboard/cms/template-config-editor"
import { CmsCollectionFieldInput } from "./field-input"
import { FieldSyntaxGuide } from "./field-syntax-guide"
import type { CmsItemEditor } from "./record-editor"
import type {
  ModuleKey,
  Status,
  TemplateEditorConfig,
  CollectionFieldSchema,
} from "@/types/type-cms"
import type { CmsRecord } from "@/types/type-cms-api"
import type { RecordDraft, TemplateConfigDraft, TemplateSlotDraft } from "@/types/type-cms-ui"

export function CmsRecordForm({
  active,
  noun,
  collectionFields,
  titleField,
  summaryField,
  renderItemEditor,
  canUploadMedia,
  mediaRecords,
  editingId,
  draft,
  onDraftChange,
  userPassword,
  onUserPasswordChange,
  templateConfigDraft,
  template,
  onChangeTemplateVariant,
  onChangeTemplateSlot,
  onSave,
  onClose,
  onUploaded,
}: {
  active: ModuleKey
  noun?: string
  collectionFields?: CollectionFieldSchema[]
  titleField?: string
  summaryField?: string
  renderItemEditor?: CmsItemEditor
  canUploadMedia: boolean
  mediaRecords: CmsRecord[]
  editingId: string | null
  draft: RecordDraft
  onDraftChange: (updater: (current: RecordDraft) => RecordDraft) => void
  userPassword: string
  onUserPasswordChange: (value: string) => void
  templateConfigDraft: TemplateConfigDraft | null
  template: TemplateEditorConfig | undefined
  onChangeTemplateVariant: (variant: string) => void
  onChangeTemplateSlot: (slotKey: string, value: TemplateSlotDraft) => void
  onSave: (event: React.FormEvent<HTMLFormElement>) => void
  onClose: () => void
  onUploaded: () => Promise<void>
}) {
  const isTemplate = active === "templates"
  const isSubmission = active === "submissions"
  const readOnlyIdentity = isTemplate || isSubmission
  const readOnlyDescription = isTemplate || active === "navigation" || active === "users"
  const titleDefinition = collectionFields?.find((field) => field.key === titleField)
  const summaryDefinition = collectionFields?.find((field) => field.key === summaryField)
  const dynamicFields = collectionFields?.filter((field) => field.key !== titleField && field.key !== summaryField) ?? []

  return (
    <form onSubmit={onSave} className="mb-5 rounded-xl border border-violet-200 bg-violet-50/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">{editingId ? `Ubah ${noun}` : `Tambah ${noun}`}</h3>
        <button type="button" aria-label="Tutup formulir" onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-white hover:text-slate-700"><X className="size-4" /></button>
      </div>
      {active === "items" && renderItemEditor ? (
        renderItemEditor({ collectionFields, mediaRecords, draft, onDraftChange, canUploadMedia, onUploaded })
      ) : <div className="grid gap-3 md:grid-cols-2">
        <label className="text-xs font-medium text-slate-700">{isTemplate ? "Nama registry" : isSubmission ? "Nama pendaftar" : active === "items" ? titleDefinition?.label || "Judul" : "Nama / judul"}<input required autoFocus value={draft.title} readOnly={readOnlyIdentity} onChange={(event) => onDraftChange((current) => ({ ...current, title: event.target.value }))} className={inputClassName()} /></label>
        <label className="text-xs font-medium text-slate-700">{isSubmission ? "Kode referensi" : active === "users" ? "Email" : isTemplate ? "Key registry" : "Slug / key"}<input value={draft.slug} readOnly={readOnlyIdentity} onChange={(event) => onDraftChange((current) => ({ ...current, slug: event.target.value }))} className={inputClassName()} /></label>
        {!(active === "items" && collectionFields && !summaryDefinition) && <label className="text-xs font-medium text-slate-700 md:col-span-2">{isSubmission ? "Catatan peninjauan" : active === "items" ? summaryDefinition?.label || "Ringkasan" : "Deskripsi / ringkasan"}<textarea rows={2} required={summaryDefinition?.required} value={draft.description} readOnly={readOnlyDescription} onChange={(event) => onDraftChange((current) => ({ ...current, description: event.target.value }))} className={inputClassName()} /></label>}
        {active !== "templates" && active !== "items" && !isSubmission && (
          active === "collections" ? (
            <div className="text-xs font-medium text-slate-700 md:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label htmlFor="collection-fields">Field koleksi</label>
                <FieldSyntaxGuide />
              </div>
              <input
                id="collection-fields"
                value={draft.fields}
                onChange={(event) => onDraftChange((current) => ({ ...current, fields: event.target.value }))}
                placeholder="kategori:select[Akademik|Prestasi]!, minat:multiselect[Musik|Olahraga]"
                className={inputClassName()}
              />
              <span className="mt-1 block font-normal leading-relaxed text-slate-500">
                Pisahkan field dengan koma. Tambahkan <code className="font-mono text-slate-600">!</code> di akhir tipe untuk menandai wajib.
              </span>
            </div>
          ) : (
            <label className="text-xs font-medium text-slate-700 md:col-span-2">
              Catatan / metadata
              <input value={draft.fields} onChange={(event) => onDraftChange((current) => ({ ...current, fields: event.target.value }))} className={inputClassName()} />
            </label>
          )
        )}
        {active === "collections" && (
          <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 text-xs md:col-span-2">
            <input
              type="checkbox"
              checked={draft.itemData?.hasPublicDetail === true}
              onChange={(event) => onDraftChange((current) => ({ ...current, itemData: { ...(current.itemData ?? {}), hasPublicDetail: event.target.checked } }))}
              className="mt-0.5 size-4 accent-violet-700"
            />
            <span><span className="block font-semibold text-slate-700">Aktifkan halaman detail publik</span><span className="mt-1 block font-normal leading-relaxed text-slate-500">Izinkan pengunjung membuka URL untuk setiap item. Aktifkan untuk koleksi seperti berita yang memiliki halaman artikel.</span></span>
          </label>
        )}
        {active === "items" && dynamicFields.map((field) => (
          <label key={field.key} htmlFor={`item-field-${field.key}`} className="text-xs font-medium text-slate-700 md:col-span-2">
            {field.label}{field.required && <span className="ml-1 text-rose-600">*</span>}
            <CmsCollectionFieldInput field={field} value={draft.itemData?.[field.key]} media={mediaRecords} onChange={(value) => onDraftChange((current) => ({ ...current, itemData: { ...(current.itemData ?? {}), [field.key]: value } }))} />
            {field.helpText && <span id={`item-help-${field.key}`} className="mt-1 block font-normal text-slate-500">{field.helpText}</span>}
          </label>
        ))}
        {isTemplate && templateConfigDraft && (
          <CmsTemplateConfigEditor
            template={template}
            config={templateConfigDraft}
            onChangeVariant={onChangeTemplateVariant}
            onChangeSlot={onChangeTemplateSlot}
          />
        )}
        {active === "users" && <label className="text-xs font-medium text-slate-700">{editingId ? "Reset password (opsional)" : "Password awal"}<input required={!editingId} type="password" minLength={12} maxLength={128} value={userPassword} onChange={(event) => onUserPasswordChange(event.target.value)} className={inputClassName()} /><span className="mt-1 block font-normal text-slate-500">Minimal 12 karakter. Reset password akan mengakhiri sesi pengguna tersebut.</span></label>}
        {!isTemplate && <label className="text-xs font-medium text-slate-700">Status<select value={draft.status} onChange={(event) => onDraftChange((current) => ({ ...current, status: event.target.value as Status }))} className={inputClassName()}>{statusOptions(active).map((status) => <option key={status}>{status}</option>)}</select></label>}
      </div>}
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 hover:bg-slate-50">Batal</button>
        <button className="inline-flex h-9 items-center gap-2 rounded-lg bg-violet-700 px-3 text-xs font-semibold text-white hover:bg-violet-800"><Check className="size-4" /> Simpan</button>
      </div>
    </form>
  )
}
