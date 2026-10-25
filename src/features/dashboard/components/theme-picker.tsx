"use client"

import { Check, Palette } from "lucide-react"
import { siteThemes, useSiteTheme, type SiteTheme } from "@/components/providers/site-theme-provider"

const themes: { id: SiteTheme; sample: string; muted: string }[] = [
  { id: "violet", sample: "#6d28d9", muted: "#ede9fe" },
  { id: "ocean", sample: "#0369a1", muted: "#e0f2fe" },
  { id: "forest", sample: "#047857", muted: "#d1fae5" },
  { id: "amber", sample: "#b45309", muted: "#fef3c7" },
]

export function ThemePicker() {
  const { theme, setTheme } = useSiteTheme()

  return (
    <section
      id="themes"
      aria-labelledby="theme-picker-title"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Palette className="size-4 text-violet-700" />
            <h2 id="theme-picker-title" className="text-base font-semibold text-slate-900">
              Tema website
            </h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Pilih palet warna untuk pratinjau profil publik sekolah.
          </p>
        </div>
        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700">
          Pratinjau lokal
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {themes.map((item) => {
          const selected = theme === item.id
          const palette = siteThemes[item.id]

          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setTheme(item.id)}
              className={`group rounded-xl border p-3 text-left transition ${
                selected
                  ? "border-violet-400 bg-violet-50/60 ring-2 ring-violet-100"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <span
                className="flex h-14 items-end gap-1.5 overflow-hidden rounded-lg p-2"
                style={{ backgroundColor: item.muted }}
                aria-hidden="true"
              >
                <span className="h-6 w-2/5 rounded-t bg-white/90" />
                <span className="h-8 w-1/5 rounded-t" style={{ backgroundColor: item.sample }} />
                <span className="h-5 flex-1 rounded-t bg-white/70" />
                <span className="mb-1 ml-auto size-3 rounded-full" style={{ backgroundColor: item.sample }} />
              </span>
              <span className="mt-3 flex items-center justify-between gap-2">
                <span>
                  <span className="block text-xs font-semibold text-slate-800">{palette.name}</span>
                  <span className="mt-1 block text-[10px] text-slate-500">
                    {selected ? "Sedang dipilih" : "Pilih tema"}
                  </span>
                </span>
                <span
                  className="flex size-6 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: item.sample }}
                >
                  {selected && <Check className="size-3.5" />}
                </span>
              </span>
            </button>
          )
        })}
      </div>
      <p className="mt-4 text-xs leading-relaxed text-slate-500">
        Pilihan tema tersimpan di browser ini dan diterapkan pada halaman profil saat dibuka di browser yang sama. Pengaturan tema publik global memerlukan penyimpanan konfigurasi di server.
      </p>
    </section>
  )
}
