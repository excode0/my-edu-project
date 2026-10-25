import Link from "next/link"
import {
  Check,
  ChevronRight,
  Code2,
  Component,
  FileEdit,
  LayoutTemplate,
  LockKeyhole,
  Palette,
  Type,
} from "lucide-react"

const templates = [
  {
    name: "Akademik",
    description: "Tampilan formal dengan fokus pada profil dan program sekolah.",
    color: "#6d28d9",
    surface: "#f5f3ff",
    active: true,
  },
  {
    name: "Modern",
    description: "Tata letak editorial untuk berita dan kegiatan yang aktif.",
    color: "#0369a1",
    surface: "#f0f9ff",
    active: false,
  },
  {
    name: "Klasik",
    description: "Gaya institusional dengan hierarki informasi yang tegas.",
    color: "#047857",
    surface: "#ecfdf5",
    active: false,
  },
]

const pageSections = [
  { name: "Beranda", status: "Terbit", target: "/" },
  { name: "Tentang sekolah", status: "Terbit", target: "/#tentang" },
  { name: "Program pendidikan", status: "Terbit", target: "/#program" },
  { name: "Prestasi & berita", status: "Terbit", target: "/#prestasi" },
  { name: "Penerimaan siswa", status: "Konsep", target: "/#pendaftaran" },
]

export function TemplateCatalog() {
  return (
    <section
      id="templates"
      aria-labelledby="templates-title"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 sm:p-6"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-9 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
          <LayoutTemplate className="size-4" />
        </span>
        <div>
          <h2 id="templates-title" className="text-base font-semibold text-slate-900">
            Daftar Template
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Pilihan kerangka tampilan untuk kebutuhan situs sekolah.
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {templates.map((template) => (
          <article
            key={template.name}
            className={`rounded-xl border p-3 ${
              template.active ? "border-violet-300 bg-violet-50/40" : "border-slate-200"
            }`}
          >
            <div
              className="flex h-24 flex-col gap-2 overflow-hidden rounded-lg p-2.5"
              style={{ backgroundColor: template.surface }}
              aria-hidden="true"
            >
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded-sm" style={{ backgroundColor: template.color }} />
                <span className="h-1.5 w-12 rounded bg-slate-300" />
                <span className="ml-auto h-1.5 w-8 rounded" style={{ backgroundColor: template.color }} />
              </span>
              <span className="mt-1 h-5 w-3/4 rounded" style={{ backgroundColor: `${template.color}22` }} />
              <span className="flex flex-1 gap-1.5">
                <span className="flex-1 rounded bg-white/90" />
                <span className="w-1/3 rounded" style={{ backgroundColor: `${template.color}33` }} />
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <h3 className="text-xs font-semibold text-slate-800">{template.name}</h3>
              {template.active ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-700">
                  <Check className="size-3" /> Aktif
                </span>
              ) : (
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-500">
                  Konsep
                </span>
              )}
            </div>
            <p className="mt-1.5 min-h-9 text-[11px] leading-relaxed text-slate-500">
              {template.description}
            </p>
          </article>
        ))}
      </div>
      <p className="mt-4 text-xs text-slate-500">
        Template selain yang aktif masih berupa konsep; pemilihan template belum mengubah situs publik.
      </p>
    </section>
  )
}

export function DesignSystemPanel() {
  return (
    <section
      id="design-system"
      aria-labelledby="design-system-title"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 sm:p-6"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-9 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
          <Component className="size-4" />
        </span>
        <div>
          <h2 id="design-system-title" className="text-base font-semibold text-slate-900">
            Design System
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Panduan visual untuk menjaga konsistensi semua halaman.
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Palette className="size-3.5" /> Warna
          </div>
          <div className="mt-3 flex gap-1.5">
            {["#6d28d9", "#0369a1", "#047857", "#b45309", "#f1f5f9"].map((color) => (
              <span
                key={color}
                className="size-6 rounded-md border border-black/5"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
          <p className="mt-2 text-[10px] text-slate-500">Palet tema dan warna netral</p>
        </div>
        <div className="rounded-xl border border-slate-200 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Type className="size-3.5" /> Tipografi
          </div>
          <p className="mt-3 text-lg font-semibold tracking-tight text-slate-900">Aa</p>
          <p className="mt-1 text-[10px] text-slate-500">Geist · heading & body</p>
        </div>
        <div className="rounded-xl border border-slate-200 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Code2 className="size-3.5" /> Komponen
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="rounded-md bg-violet-700 px-2.5 py-1.5 text-[10px] font-semibold text-white">
              Tombol
            </span>
            <span className="rounded-md border border-slate-200 px-2.5 py-1.5 text-[10px] text-slate-600">
              Kartu
            </span>
          </div>
          <p className="mt-2 text-[10px] text-slate-500">Elemen UI yang dapat digunakan ulang</p>
        </div>
      </div>
    </section>
  )
}

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
