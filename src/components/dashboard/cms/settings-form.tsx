import { Check } from "lucide-react"
import { inputClassName } from "@/components/dashboard/cms/presentation"
import type { CmsData } from "@/types/type-cms-api"

type Settings = CmsData["settings"]

export function CmsSettingsForm({
  settings,
  canManage,
  onChange,
  onSubmit,
}: {
  settings: Settings
  canManage: boolean
  onChange: (settings: Settings) => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
}) {
  return (
    <form onSubmit={onSubmit} className="grid max-w-2xl gap-4">
      <label className="text-xs font-medium text-slate-700">Judul website<input value={settings.siteTitle} onChange={(event) => onChange({ ...settings, siteTitle: event.target.value })} className={inputClassName()} /></label>
      <label className="text-xs font-medium text-slate-700">Deskripsi SEO global<textarea rows={3} value={settings.description} onChange={(event) => onChange({ ...settings, description: event.target.value })} className={inputClassName()} /></label>
      <label className="text-xs font-medium text-slate-700">Status penerimaan<input value={settings.admissionStatus} onChange={(event) => onChange({ ...settings, admissionStatus: event.target.value })} className={inputClassName()} /></label>
      <label className="flex items-center gap-2 text-xs font-medium text-slate-700"><input type="checkbox" checked={settings.admissionEnabled} onChange={(event) => onChange({ ...settings, admissionEnabled: event.target.checked })} className="size-4 accent-violet-700" /> Buka formulir pendaftaran publik</label>
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-[11px] text-slate-400">Pengaturan disimpan di PostgreSQL; secret tidak ditampilkan di formulir.</p><button disabled={!canManage} className="inline-flex h-9 items-center gap-2 rounded-lg bg-violet-700 px-4 text-xs font-semibold text-white hover:bg-violet-800 disabled:opacity-50"><Check className="size-4" /> Simpan pengaturan</button></div>
    </form>
  )
}
