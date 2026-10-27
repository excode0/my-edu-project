import Image from "next/image"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { programs } from "./content"
import type { HomeCollectionItem } from "@/types/type-public-site-view"

export function HomePrograms({ programs: programItems, indexHref }: { programs: HomeCollectionItem[]; indexHref: string }) {
  const cards = programItems.length
    ? programItems.map((item, index) => {
      const fallback = programs[index % programs.length]
      return {
        key: item.id,
        title: item.title,
        description: item.description,
        href: item.href,
        imageUrl: item.imageUrl,
        meta: item.meta,
        icon: fallback.icon,
        color: fallback.color,
      }
    })
    : programs.map((program) => ({
      key: program.title,
      title: program.title,
      description: program.description,
      href: "#pendaftaran",
      imageUrl: undefined,
      meta: undefined,
      icon: program.icon,
      color: program.color,
    }))

  return (
    <section id="program" className="scroll-mt-24 bg-slate-50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-700">Pendidikan</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Ruang belajar untuk setiap minat.</h2>
          </div>
          <div className="max-w-md">
            <p className="text-sm leading-6 text-slate-500">Program dan kegiatan dirancang untuk mengembangkan kemampuan akademik sekaligus keterampilan hidup.</p>
            {programItems.length > 0 && (
              <Link href={indexHref} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-violet-700">Semua program <ChevronRight className="size-4" /></Link>
            )}
          </div>
        </div>
        <div className="mt-9 grid gap-4 md:grid-cols-3">
          {cards.map((program) => {
            const Icon = program.icon
            return (
              <article key={program.key} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60">
                {program.imageUrl ? (
                  <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
                    <Image src={program.imageUrl} alt={program.title} fill sizes="(min-width: 768px) 33vw, 90vw" unoptimized className="object-cover transition duration-500 group-hover:scale-105" />
                  </div>
                ) : (
                  <div className="px-6 pt-6">
                    <span className={`flex size-11 items-center justify-center rounded-xl ${program.color}`}><Icon className="size-5" /></span>
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-base font-semibold"><Link href={program.href} className="hover:text-violet-700">{program.title}</Link></h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{program.description}</p>
                  {program.meta && <p className="mt-3 text-xs font-semibold text-violet-700">{program.meta}</p>}
                  <Link href={program.href} className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-violet-700">Pelajari lebih lanjut <ChevronRight className="size-3.5" /></Link>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
