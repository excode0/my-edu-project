import type { ModuleKey, RecordDraft, Status } from "../types"

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value))
}

export function statusStyle(status: Status) {
  if (status === "Terbit" || status === "Diterima") return "bg-emerald-50 text-emerald-700"
  if (status === "Baru" || status === "Ditinjau") return "bg-amber-50 text-amber-700"
  if (status === "Diarsipkan") return "bg-slate-100 text-slate-500"
  return "bg-violet-50 text-violet-700"
}

export function statusOptions(module: ModuleKey): Status[] {
  if (module === "submissions") return ["Baru", "Ditinjau", "Diterima", "Ditolak", "Daftar tunggu", "Diarsipkan"]
  if (module === "users" || module === "collections") return ["Terbit", "Diarsipkan"]
  return ["Draf", "Terbit", "Diarsipkan"]
}

export const blankDraft: RecordDraft = {
  title: "",
  slug: "",
  description: "",
  fields: "",
  status: "Draf",
}

export function inputClassName() {
  return "mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
}
