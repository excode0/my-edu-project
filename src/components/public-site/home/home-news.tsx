import { ArrowRight } from "lucide-react"
import Link from "next/link"
import type { HomeCollectionItem, HomeNewsItem } from "@/types/type-public-site-view"
import { achievements, getNewsCategory, getNewsDate } from "./content"

function formatAchievementDate(value: string | undefined) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(date)
}

export function HomeNews({
  news,
  indexHref,
  achievements: achievementItems,
  achievementsIndexHref,
}: {
  news: HomeNewsItem[]
  indexHref: string
  achievements: HomeCollectionItem[]
  achievementsIndexHref: string
}) {
  const achievementCards = achievementItems.length
    ? achievementItems.map((item, index) => ({
      key: item.id,
      title: item.title,
      href: item.href,
      icon: achievements[index % achievements.length].icon,
      category: [item.category, item.meta].filter(Boolean).join(" · "),
      date: formatAchievementDate(item.date),
    }))
    : achievements.map((achievement) => ({
      key: achievement.title,
      title: achievement.title,
      href: undefined,
      icon: achievement.icon,
      category: achievement.category,
      date: "",
    }))

  return (
    <section id="prestasi" className="scroll-mt-24 mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-700">Kabar baik dari sekolah</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Prestasi & cerita terbaru.</h2>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {achievementItems.length > 0 && <Link href={achievementsIndexHref} className="inline-flex items-center gap-1 text-sm font-semibold text-violet-700">Semua prestasi <ArrowRight className="size-4" /></Link>}
          <Link href={indexHref} className="inline-flex items-center gap-1 text-sm font-semibold text-violet-700">Semua cerita <ArrowRight className="size-4" /></Link>
        </div>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {achievementCards.map((achievement) => {
          const Icon = achievement.icon
          return (
            <article key={achievement.key} className="flex gap-4 rounded-2xl border border-slate-200 p-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><Icon className="size-5" /></span>
              <div>
                <p className="text-sm font-semibold leading-5">
                  {achievement.href ? <Link href={achievement.href} className="hover:text-violet-700">{achievement.title}</Link> : achievement.title}
                </p>
                {achievement.category && <p className="mt-2 text-xs text-slate-500">{achievement.category}</p>}
                {achievement.date && <p className="mt-1 text-[11px] text-slate-400">{achievement.date}</p>}
              </div>
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
