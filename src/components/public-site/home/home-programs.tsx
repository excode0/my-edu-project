import { ChevronRight } from "lucide-react"
import { programs } from "./content"

export function HomePrograms() {
  return (
    <section id="program" className="scroll-mt-24 bg-slate-50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-700">Pendidikan</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Ruang belajar untuk setiap minat.</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-slate-500">Program dan kegiatan dirancang untuk mengembangkan kemampuan akademik sekaligus keterampilan hidup.</p>
        </div>
        <div className="mt-9 grid gap-4 md:grid-cols-3">
          {programs.map((program) => {
            const Icon = program.icon
            return (
              <article key={program.title} className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60">
                <span className={`flex size-11 items-center justify-center rounded-xl ${program.color}`}><Icon className="size-5" /></span>
                <h3 className="mt-5 text-base font-semibold">{program.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{program.description}</p>
                <a href="#kontak" className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-violet-700">Pelajari lebih lanjut <ChevronRight className="size-3.5" /></a>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
