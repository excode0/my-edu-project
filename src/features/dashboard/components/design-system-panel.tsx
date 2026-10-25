import { Code2, Component, Palette, Type } from "lucide-react"

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
