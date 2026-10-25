import Link from "next/link"
import { ChevronRight, FileEdit, LockKeyhole } from "lucide-react"

const pageSections = [
  { name: "Beranda", status: "Terbit", target: "/" },
  { name: "Tentang sekolah", status: "Terbit", target: "/#tentang" },
  { name: "Program pendidikan", status: "Terbit", target: "/#program" },
  { name: "Prestasi & berita", status: "Terbit", target: "/#prestasi" },
  { name: "Penerimaan siswa", status: "Konsep", target: "/#pendaftaran" },
]

export function PageEditorPanel() {
  return (
    <section
      id="editor"
      aria-labelledby="editor-title"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
            <FileEdit className="size-4" />
          </span>
          <div>
            <h2 id="editor-title" className="text-base font-semibold text-slate-900">
              Editor
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Susunan halaman profil sekolah yang tersedia untuk dikelola.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-medium text-amber-700">
          <LockKeyhole className="size-3" /> Editor visual belum aktif
        </span>
      </div>
      <div className="mt-5 divide-y divide-slate-100 rounded-xl border border-slate-200">
        {pageSections.map((section, index) => (
          <div key={section.name} className="flex items-center gap-3 px-3 py-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[10px] font-semibold text-slate-500">
              {index + 1}
            </span>
            <span className="flex-1 text-xs font-medium text-slate-700">{section.name}</span>
            <span
              className={`rounded-full px-2 py-1 text-[10px] font-medium ${
                section.status === "Terbit"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {section.status}
            </span>
            <Link
              href={section.target}
              target="_blank"
              aria-label={`Pratinjau ${section.name}`}
              className="flex size-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <ChevronRight className="size-4" />
            </Link>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Daftar ini menyiapkan struktur halaman; penyuntingan dan publikasi konten memerlukan CMS/backend.
      </p>
    </section>
  )
}
