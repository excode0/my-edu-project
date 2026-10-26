import Link from "next/link"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { AdmissionForm } from "../admissions/admission-form"
import { getPublicRoute, getPublicSiteData } from "@/lib/public-site/server/data"
import { sanitizeCmsRichText } from "@/lib/cms/server/domain/richtext"

type PublicContentProps = {
  params: Promise<{ path: string[] }>
}

export function PublicContentPage({ params }: PublicContentProps) {
  return (
    <Suspense fallback={<main className="min-h-screen bg-white p-10 text-center text-sm text-slate-500">Memuat halaman...</main>}>
      <PublicContent params={params} />
    </Suspense>
  )
}

async function PublicContent({ params }: PublicContentProps) {
  const { path } = await params
  const routePath = `/${path.join("/")}`
  const [route, site] = await Promise.all([
    getPublicRoute(routePath),
    getPublicSiteData(),
  ])
  if (!route) notFound()

  const safeBody = route.kind === "collection-item"
    ? sanitizeCmsRichText(route.body)
    : ""

  return (
    <main className="site-public min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-200">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link href="/" className="text-sm font-bold tracking-tight text-slate-900">{site.identity.name}</Link>
          <nav aria-label="Navigasi utama" className="flex flex-wrap gap-x-5 gap-y-2">
            {site.navigation.map((item) => (
              <a key={`${item.label}-${item.href}`} href={item.href} className="text-xs font-medium text-slate-600 hover:text-violet-700">{item.label}</a>
            ))}
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
        <Link href="/" className="text-xs font-semibold text-violet-700 hover:text-violet-900">← Beranda</Link>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{route.title}</h1>
        {route.description && <p className="mt-4 max-w-3xl whitespace-pre-line text-sm leading-7 text-slate-600">{route.description}</p>}

        {route.kind === "page" && route.fields && (
          <p className="mt-6 border-t border-slate-200 pt-5 text-xs text-slate-500">{route.fields}</p>
        )}

        {route.kind === "collection-list" && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {route.items.length ? route.items.map((item) => (
              <article key={item.id} className="rounded-2xl border border-slate-200 p-5">
                <h2 className="text-lg font-semibold text-slate-900">
                  {route.prefix && route.hasPublicDetail ? (
                    <Link href={`${route.prefix}/${encodeURIComponent(item.slug)}`} className="hover:text-violet-700">{item.title}</Link>
                  ) : item.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                <time className="mt-4 block text-xs text-slate-400" dateTime={item.publishedAt}>
                  {new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(item.publishedAt))}
                </time>
              </article>
            )) : <p className="rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">Belum ada konten yang diterbitkan.</p>}
          </div>
        )}

        {route.kind === "collection-item" && (
          <article className="mt-8 max-w-3xl">
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              {route.category && <span className="rounded-full bg-violet-50 px-3 py-1 font-semibold text-violet-700">{route.category}</span>}
              <time dateTime={route.publishedAt}>
                {new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(route.publishedAt))}
              </time>
            </div>
            <div className="prose prose-slate mt-6 max-w-none text-sm leading-7" dangerouslySetInnerHTML={{ __html: safeBody }} />
          </article>
        )}

        {route.kind === "admission" && (
          site.settings.admissionEnabled
            ? <div className="mt-8 max-w-2xl"><AdmissionForm fields={site.admissionFields} /></div>
            : <p className="mt-8 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Pendaftaran saat ini ditutup. Silakan hubungi sekolah untuk informasi lebih lanjut.</p>
        )}
      </div>
    </main>
  )
}
