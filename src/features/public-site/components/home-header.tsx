import Link from "next/link"
import { ArrowRight, Menu, School } from "lucide-react"

export function HomeHeader({
  schoolName,
  navigation,
}: {
  schoolName: string
  navigation: { label: string; href: string }[]
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-3" aria-label={`${schoolName}, beranda`}>
          <span className="flex size-10 items-center justify-center rounded-xl bg-violet-700 text-white">
            <School className="size-5" />
          </span>
          <span>
            <span className="block text-sm font-bold tracking-tight">{schoolName}</span>
            <span className="mt-0.5 block text-[10px] font-medium tracking-[0.14em] text-slate-500">BANDUNG · JAWA BARAT</span>
          </span>
        </Link>
        <nav aria-label="Navigasi utama" className="hidden items-center gap-7 md:flex">
          {navigation.map((item) => <a key={`${item.label}-${item.href}`} href={item.href} className="text-sm font-medium text-slate-600 transition hover:text-violet-700">{item.label}</a>)}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="hidden rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 sm:inline-flex"
          >
            Panel admin
          </Link>
          <a
            href="#pendaftaran"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-violet-700 px-4 text-xs font-semibold text-white transition hover:bg-violet-800"
          >
            Pendaftaran <ArrowRight className="size-3.5" />
          </a>
          <details className="relative md:hidden">
            <summary aria-label="Buka menu navigasi" className="flex size-10 list-none cursor-pointer items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100">
              <Menu className="size-5" />
            </summary>
            <nav aria-label="Navigasi mobile" className="absolute right-0 top-12 z-40 flex w-48 flex-col gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
              {[...navigation, { label: "Panel admin", href: "/dashboard" }].map((item) => (
                <a key={`${item.label}-${item.href}`} href={item.href} className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-violet-50 hover:text-violet-800">
                  {item.label}
                </a>
              ))}
            </nav>
          </details>
        </div>
      </div>
    </header>
  )
}
