import { ArrowRight } from "lucide-react"
import Link from "next/link"
import type { HomeNewsItem } from "@/types/type-public-site-view"
import { achievements, getNewsCategory, getNewsDate } from "./content"

export function HomeNews({ news, indexHref }: { news: HomeNewsItem[]; indexHref: string }) {
  return (
    <section id="prestasi" className="scroll-mt-24 mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-700">Kabar baik dari sekolah</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Prestasi & cerita terbaru.</h2>
        </div>
        <Link href={indexHref} className="inline-flex items-center gap-1 text-sm font-semibold text-violet-700">Semua cerita <ArrowRight className="size-4" /></Link>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {achievements.map((achievement) => {
          const Icon = achievement.icon
          return (
            <article key={achievement.title} className="flex gap-4 rounded-2xl border border-slate-200 p-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><Icon className="size-5" /></span>
              <div><p className="text-sm font-semibold leading-5">{achievement.title}</p><p className="mt-2 text-xs text-slate-500">{achievement.category}</p></div>
            </article>
          )
        })}
      </div>
      <div id="berita" className="scroll-mt-24 mt-8 grid gap-4 md:grid-cols-2">
        {news.length ? news.map((item, index) => (
          <article key={item.id} className={`rounded-2xl p-6 ${index % 2 ? "bg-sky-50" : "bg-violet-50"}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide ${index % 2 ? "text-sky-700" : "text-violet-700"}`}>{getNewsCategory(item.fields)}</p>
            <h3 className="mt-3 text-lg font-semibold"><Link href={item.href} className="hover:text-violet-700">{item.title}</Link></h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
            <p className="mt-4 text-xs text-slate-500">{getNewsDate(item.fields, item.updatedAt)}</p>
          </article>
        )) : (
          <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500 md:col-span-2">
            Belum ada berita yang diterbitkan.
          </p>
        )}
      </div>
    </section>
  )
}
