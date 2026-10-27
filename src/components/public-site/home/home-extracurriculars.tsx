import Image from "next/image"
import Link from "next/link"
import { ArrowRight, CalendarDays, UsersRound } from "lucide-react"
import type { HomeCollectionItem } from "@/types/type-public-site-view"

export function HomeExtracurriculars({ items, indexHref }: { items: HomeCollectionItem[]; indexHref: string }) {
  if (!items.length) return null
  return (
    <section id="ekstrakurikuler" className="scroll-mt-24 mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-700">Minat & bakat</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Ruang untuk tumbuh bersama.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">Temukan kegiatan yang membantu siswa mengembangkan minat, bakat, kepemimpinan, dan kerja sama.</p>
        </div>
        <Link href={indexHref} className="inline-flex items-center gap-1 text-sm font-semibold text-violet-700">Semua ekstrakurikuler <ArrowRight className="size-4" /></Link>
      </div>
      <div className="mt-9 grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60">
            {item.imageUrl && (
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                <Image src={item.imageUrl} alt={item.title} fill sizes="(min-width: 768px) 33vw, 90vw" unoptimized className="object-cover" />
              </div>
            )}
            <div className="p-5">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700"><UsersRound className="size-5" /></span>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold"><Link href={item.href} className="hover:text-violet-700">{item.title}</Link></h3>
                  {item.meta && <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-violet-700"><CalendarDays className="size-3.5" />{item.meta}</p>}
                </div>
              </div>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">{item.description}</p>
              <Link href={item.href} className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-violet-700">Lihat kegiatan <ArrowRight className="size-3.5" /></Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
