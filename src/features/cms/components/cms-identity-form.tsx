import { Check } from "lucide-react"
import { inputClassName } from "../lib/format"
import type { CmsData } from "../types"

type Identity = CmsData["identity"]

export function CmsIdentityForm({
  identity,
  canManage,
  onChange,
  onSubmit,
}: {
  identity: Identity
  canManage: boolean
  onChange: (identity: Identity) => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
}) {
  return (
    <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
      {([
        ["name", "Nama lembaga"],
        ["shortName", "Nama singkat"],
        ["level", "Jenjang & status"],
        ["accreditation", "Akreditasi"],
        ["address", "Alamat"],
        ["phone", "Telepon"],
        ["email", "Email"],
      ] as const).map(([key, label]) => <label key={key} className="text-xs font-medium text-slate-700">{label}<input required={key === "name"} value={identity[key]} onChange={(event) => onChange({ ...identity, [key]: event.target.value })} className={inputClassName()} /></label>)}
      <label className="text-xs font-medium text-slate-700 md:col-span-2">Visi lembaga<textarea rows={3} value={identity.vision} onChange={(event) => onChange({ ...identity, vision: event.target.value })} className={inputClassName()} /></label>
      <div className="flex flex-wrap items-center justify-between gap-3 md:col-span-2"><p className="text-[11px] text-slate-400">Identitas disimpan di PostgreSQL dan perubahan dicatat di audit log.</p><button disabled={!canManage} className="inline-flex h-9 items-center gap-2 rounded-lg bg-violet-700 px-4 text-xs font-semibold text-white hover:bg-violet-800 disabled:opacity-50"><Check className="size-4" /> Simpan identitas</button></div>
    </form>
  )
}
