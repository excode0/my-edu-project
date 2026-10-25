import { Database, Plus } from "lucide-react"

const optionalCollections = [
  ["Ekstrakurikuler", "Untuk halaman kegiatan dan minat siswa"],
  ["Alumni", "Untuk direktori atau cerita alumni"],
  ["Beasiswa", "Untuk informasi bantuan pendidikan"],
  ["Unit layanan", "Untuk layanan khusus milik sekolah"],
]

export function DashboardCollections() {
  return (
    <section
      id="collections"
      aria-labelledby="collections-title"
      className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 shadow-sm shadow-slate-200/40 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <Database className="size-4" />
          </span>
          <div>
            <h2 id="collections-title" className="text-base font-semibold text-slate-900">
              Koleksi tambahan <span className="font-normal text-slate-400">(opsional)</span>
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">
              Data di luar profil inti sekolah. Tambahkan koleksi hanya ketika sekolah membutuhkan halaman atau informasi baru.
            </p>
          </div>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-500">
          Belum ada koleksi aktif
        </span>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {optionalCollections.map(([title, description]) => (
          <div key={title} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-slate-700">{title}</p>
              <span className="rounded-full bg-white px-2 py-1 text-[9px] font-medium text-slate-400">
                Opsional
              </span>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{description}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-slate-500">
        <Plus className="mt-0.5 size-3.5 shrink-0 text-violet-600" />
        Koleksi contoh ini belum dibuat sebagai data aktif. Nantinya admin dapat menambahkan koleksi sesuai halaman tambahan yang dibutuhkan.
      </p>
    </section>
  )
}
