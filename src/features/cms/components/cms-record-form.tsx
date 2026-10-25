import { Check, X } from "lucide-react"
import { inputClassName, statusOptions } from "../lib/format"
import { CmsTemplateConfigEditor } from "./cms-template-config-editor"
import type {
  ModuleKey,
  RecordDraft,
  Status,
  TemplateConfigDraft,
  TemplateEditorConfig,
  TemplateSlotDraft,
} from "../types"

export function CmsRecordForm({
  active,
  noun,
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
}: {
  active: ModuleKey
  noun?: string
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
}) {
  const isTemplate = active === "templates"
  const isSubmission = active === "submissions"
  const readOnlyIdentity = isTemplate || isSubmission
  const readOnlyDescription = isTemplate || active === "navigation" || active === "users"

  return (
    <form onSubmit={onSave} className="mb-5 rounded-xl border border-violet-200 bg-violet-50/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">{editingId ? `Ubah ${noun}` : `Tambah ${noun}`}</h3>
        <button type="button" aria-label="Tutup formulir" onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-white hover:text-slate-700"><X className="size-4" /></button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-xs font-medium text-slate-700">{isTemplate ? "Nama registry" : isSubmission ? "Nama pendaftar" : "Nama / judul"}<input required autoFocus value={draft.title} readOnly={readOnlyIdentity} onChange={(event) => onDraftChange((current) => ({ ...current, title: event.target.value }))} className={inputClassName()} /></label>
        <label className="text-xs font-medium text-slate-700">{isSubmission ? "Kode referensi" : active === "users" ? "Email" : isTemplate ? "Key registry" : "Slug / key"}<input value={draft.slug} readOnly={readOnlyIdentity} onChange={(event) => onDraftChange((current) => ({ ...current, slug: event.target.value }))} className={inputClassName()} /></label>
        <label className="text-xs font-medium text-slate-700 md:col-span-2">{isSubmission ? "Catatan peninjauan" : "Deskripsi / ringkasan"}<textarea rows={2} value={draft.description} readOnly={readOnlyDescription} onChange={(event) => onDraftChange((current) => ({ ...current, description: event.target.value }))} className={inputClassName()} /></label>
        {active !== "templates" && !isSubmission && (
          <label className="text-xs font-medium text-slate-700 md:col-span-2">
            {active === "collections" ? "Field koleksi (pisahkan dengan koma; select: kategori:select[Akademik|Prestasi], multiselect: minat:multiselect[Musik|Olahraga]!, wajib: akhiri tipe dengan !)" : active === "items" ? "Metadata (pisahkan dengan titik koma; JSON/media_multiple gunakan JSON, relation/media gunakan UUID)" : "Catatan / metadata"}
            <input value={draft.fields} onChange={(event) => onDraftChange((current) => ({ ...current, fields: event.target.value }))} className={inputClassName()} />
            {active === "items" && <span className="mt-1 block font-normal text-slate-500">Contoh: setelan:{`{"mode":"formal"}`}; galeri:{`["uuid-media-1","uuid-media-2"]`}; gambar:uuid-media. ID media dapat disalin dari pustaka media.</span>}
          </label>
        )}
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
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 hover:bg-slate-50">Batal</button>
        <button className="inline-flex h-9 items-center gap-2 rounded-lg bg-violet-700 px-3 text-xs font-semibold text-white hover:bg-violet-800"><Check className="size-4" /> Simpan</button>
      </div>
    </form>
  )
}
