import { Check } from "lucide-react"
import { inputClassName } from "@/components/dashboard/cms/presentation"
import { identityFieldGroups } from "@/components/dashboard/cms/identity/field-groups"
import type { CmsData } from "@/types/type-cms-api"

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
    <form onSubmit={onSubmit} className="space-y-5">
      {identityFieldGroups.map((group) => (
        <section key={group.title} className="rounded-xl border border-slate-200 p-4 sm:p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-slate-900">{group.title}</h2>
            <p className="mt-1 text-xs text-slate-500">{group.description}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {group.fields.map((field) => (
              <label key={field.key} className={`text-xs font-medium text-slate-700 ${field.multiline ? "md:col-span-2" : ""}`}>
                {field.label}
                {field.multiline ? (
                  <textarea rows={field.key === "address" ? 2 : 4} required={field.required} value={identity[field.key] || ""} onChange={(event) => onChange({ ...identity, [field.key]: event.target.value })} className={inputClassName()} />
                ) : (
                  <input type={field.type || "text"} required={field.required} value={identity[field.key] || ""} onChange={(event) => onChange({ ...identity, [field.key]: event.target.value })} className={inputClassName()} />
                )}
              </label>
            ))}
          </div>
        </section>
      ))}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] text-slate-400">Identitas disimpan di PostgreSQL dan perubahan dicatat di audit log.</p>
        <button disabled={!canManage} className="inline-flex h-9 items-center gap-2 rounded-lg bg-violet-700 px-4 text-xs font-semibold text-white hover:bg-violet-800 disabled:opacity-50"><Check className="size-4" /> Simpan identitas</button>
      </div>
    </form>
  )
}
