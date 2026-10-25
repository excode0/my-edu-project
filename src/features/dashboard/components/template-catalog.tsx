import { Check, LayoutTemplate } from "lucide-react"

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
