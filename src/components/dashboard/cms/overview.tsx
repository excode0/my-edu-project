import { Activity, BookOpen, FileText, FolderKanban, LayoutTemplate } from "lucide-react"
import { modules } from "./modules"
import { hasPermission } from "@/lib/auth/permissions"
import type { RecordKey } from "@/types/type-cms"
import type { CmsData } from "@/types/type-cms-api"

export function CmsOverview({
  data,
  totalItems,
  countRecords,
  permissions,
}: {
  data: CmsData
  totalItems: number
  countRecords: (key: RecordKey) => number
  permissions: string[]
}) {
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total konten", value: totalItems, detail: "di seluruh modul", icon: FolderKanban },
          { label: "Halaman terbit", value: data.records.pages.filter((item) => item.status === "Terbit").length, detail: "halaman publik", icon: FileText },
          { label: "Pendaftar baru", value: data.records.submissions.filter((item) => item.status === "Baru").length, detail: "perlu ditinjau", icon: BookOpen },
          { label: "Template aktif", value: data.records.templates.filter((item) => item.status === "Terbit").length, detail: "registry tampilan", icon: LayoutTemplate },
        ].map((item) => {
          const StatIcon = item.icon
          return <article key={item.label} className="rounded-xl border border-slate-200 p-4"><span className="flex size-9 items-center justify-center rounded-lg bg-violet-50 text-violet-700"><StatIcon className="size-4" /></span><p className="mt-4 text-xs text-slate-500">{item.label}</p><p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{item.value}</p><p className="mt-1 text-[11px] text-slate-400">{item.detail}</p></article>
        })}
      </div>
      <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-800">Modul yang tersedia</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {modules.filter((module) => module.recordKey && (!module.permission || hasPermission(permissions, module.permission))).map((module) => {
              const ModuleIcon = module.icon
              return <a key={module.key} href={`#${module.key}`} className="flex items-center gap-2.5 rounded-lg p-2.5 text-xs text-slate-600 transition hover:bg-slate-50"><ModuleIcon className="size-4 text-violet-600" /><span className="flex-1">{module.label}</span><span className="text-slate-400">{module.recordKey ? countRecords(module.recordKey) : 0}</span></a>
            })}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-slate-800">Aktivitas terakhir</h3><a href="#audit" className="text-[11px] font-medium text-violet-700 hover:text-violet-900">Semua log</a></div>
          {data.audit.length ? <div className="mt-3 space-y-3">{data.audit.slice(0, 4).map((entry) => <div key={entry.id} className="flex gap-2.5"><span className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500"><Activity className="size-3" /></span><div className="min-w-0"><p className="text-xs font-medium text-slate-700">{entry.title}</p><p className="mt-0.5 truncate text-[10px] text-slate-500">{entry.description}</p></div></div>)}</div> : <p className="mt-3 text-xs text-slate-500">Aktivitas perubahan akan tampil di sini.</p>}
        </div>
      </div>
    </div>
  )
}
