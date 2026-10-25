import { Activity } from "lucide-react"
import { formatDate } from "@/components/dashboard/cms/presentation"
import type { CmsData } from "@/types/type-cms-api"

export function CmsAuditLog({ entries }: { entries: CmsData["audit"] }) {
  return (
    <div className="space-y-3">
      {entries.length ? entries.map((entry) => <article key={entry.id} className="flex gap-3 rounded-xl border border-slate-100 p-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500"><Activity className="size-4" /></span><div className="min-w-0 flex-1"><p className="text-xs font-semibold text-slate-800">{entry.title}</p><p className="mt-1 text-xs text-slate-500">{entry.description}</p></div><time className="shrink-0 text-[10px] text-slate-400">{formatDate(entry.updatedAt)}</time></article>) : <div className="rounded-xl border border-dashed border-slate-200 px-4 py-12 text-center"><Activity className="mx-auto size-6 text-slate-300" /><p className="mt-3 text-sm font-medium text-slate-700">Belum ada aktivitas</p><p className="mt-1 text-xs text-slate-500">Aktivitas administratif akan dicatat di sini.</p></div>}
    </div>
  )
}
