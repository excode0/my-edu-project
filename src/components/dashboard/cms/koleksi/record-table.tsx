import Link from "next/link"
import { ExternalLink, Trash2 } from "lucide-react"
import { formatDate, statusStyle } from "@/components/dashboard/cms/presentation"
import type { ModuleKey } from "@/types/type-cms"
import type { CmsRecord } from "@/types/type-cms-api"

const deletableModules: ModuleKey[] = ["collections", "items", "pages", "navigation", "users", "media"]

function getPublicItemHref(active: ModuleKey, record: CmsRecord) {
  const prefix = record.collectionUrlPrefix
  if (active !== "items" || record.status !== "Terbit" || !record.hasPublicDetail || !prefix?.startsWith("/") || prefix.startsWith("//")) return null
  const safePrefix = prefix.replace(/\/+$/, "")
  return `${safePrefix}/${encodeURIComponent(record.slug)}`
}

export function CmsRecordTable({
  active,
  noun,
  records,
  visibleRecords,
  canManage,
  canPublish,
  onEdit,
  onToggleStatus,
  onDelete,
}: {
  active: ModuleKey
  noun?: string
  records: CmsRecord[]
  visibleRecords: CmsRecord[]
  canManage: boolean
  canPublish: boolean
  onEdit: (record: CmsRecord) => void
  onToggleStatus: (record: CmsRecord) => void
  onDelete: (record: CmsRecord) => void
}) {
  const canToggleStatus = canManage && active !== "submissions" && active !== "users" && active !== "media" && active !== "templates" && (active !== "items" || canPublish)
  const canDelete = canManage && deletableModules.includes(active)

  return (
    <div>
      <div className="space-y-3 xl:hidden">
        {visibleRecords.map((record) => {
          const publicHref = getPublicItemHref(active, record)
          return (
          <article key={record.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold leading-5 text-slate-800">{record.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{record.description}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${statusStyle(record.status)}`}>{record.status}</span>
            </div>
            <dl className="mt-3 space-y-2 border-t border-slate-100 pt-3 text-[11px]">
              <div className="flex gap-2">
                <dt className="w-16 shrink-0 text-slate-400">{active === "submissions" ? "Referensi" : active === "users" ? "Email" : "Slug"}</dt>
                <dd className="min-w-0 break-all font-mono text-slate-600">{record.slug || "—"}</dd>
              </div>
              {record.fields && (
                <div className="flex gap-2">
                  <dt className="w-16 shrink-0 text-slate-400">Detail</dt>
                  <dd className="min-w-0 break-words text-slate-500">{record.fields}</dd>
                </div>
              )}
              <div className="flex gap-2">
                <dt className="w-16 shrink-0 text-slate-400">Diperbarui</dt>
                <dd className="text-slate-500">{formatDate(record.updatedAt)}</dd>
              </div>
            </dl>
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
              {publicHref && <Link href={publicHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"><ExternalLink className="size-3.5" />Pratinjau publik</Link>}
              {canManage && active !== "media" && <button type="button" onClick={() => onEdit(record)} className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-50">Ubah</button>}
              {canToggleStatus && (
                <button type="button" onClick={() => onToggleStatus(record)} className="rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100">
                  {record.status === "Terbit" ? active === "collections" ? "Arsipkan" : "Jadikan draf" : "Terbitkan"}
                </button>
              )}
              {canDelete && <button type="button" aria-label={`Hapus ${record.title}`} onClick={() => onDelete(record)} className="ml-auto rounded-md p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-700"><Trash2 className="size-4" /></button>}
            </div>
          </article>
          )
        })}
        {!visibleRecords.length && <p className="rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center text-xs text-slate-500">Tidak ada data yang sesuai dengan pencarian.</p>}
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 xl:block">
        <table className="w-full min-w-[700px] table-fixed border-collapse text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="w-[28%] px-4 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Nama</th>
              <th className="w-[24%] px-4 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Slug / detail</th>
              <th className="w-[9%] px-3 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Status</th>
              <th className="w-[17%] px-3 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Diperbarui</th>
              <th className="w-[22%] px-3 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleRecords.map((record) => {
              const publicHref = getPublicItemHref(active, record)
              return (
              <tr key={record.id} className="align-top hover:bg-slate-50/70">
                <td className="px-4 py-3"><p className="text-xs font-semibold text-slate-800">{record.title}</p><p className="mt-1 max-w-sm text-[11px] leading-relaxed text-slate-500">{record.description}</p></td>
                <td className="px-4 py-3"><p className="font-mono text-[10px] text-slate-600">{record.slug || "—"}</p><p className="mt-1 max-w-xs text-[10px] leading-relaxed text-slate-400">{record.fields || "—"}</p></td>
                <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${statusStyle(record.status)}`}>{record.status}</span></td>
                <td className="whitespace-nowrap px-4 py-3 text-[10px] text-slate-500">{formatDate(record.updatedAt)}</td>
                <td className="px-4 py-3"><div className="flex flex-nowrap items-center gap-1 whitespace-nowrap">{publicHref && <Link href={publicHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-1.5 text-[10px] font-medium text-slate-600 hover:bg-slate-100"><ExternalLink className="size-3" />Lihat</Link>}{canManage && active !== "media" && <button type="button" onClick={() => onEdit(record)} className="whitespace-nowrap rounded-md px-2 py-1.5 text-[10px] font-semibold text-violet-700 hover:bg-violet-50">Ubah</button>}{canToggleStatus && <button type="button" onClick={() => onToggleStatus(record)} className="whitespace-nowrap rounded-md px-2 py-1.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-100">{record.status === "Terbit" ? active === "collections" ? "Arsipkan" : "Jadikan draf" : "Terbitkan"}</button>}{canDelete && <button type="button" aria-label={`Hapus ${record.title}`} onClick={() => onDelete(record)} className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-700"><Trash2 className="size-3.5" /></button>}</div></td>
              </tr>
              )
            })}
            {!visibleRecords.length && <tr><td colSpan={5} className="px-4 py-10 text-center text-xs text-slate-500">Tidak ada data yang sesuai dengan pencarian.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[10px] text-slate-400">Menampilkan {visibleRecords.length} dari {records.length} {noun} · PostgreSQL</p>
    </div>
  )
}
