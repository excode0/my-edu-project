import Link from "next/link"
import { CalendarDays, ChevronRight, Eye, School } from "lucide-react"
import { DashboardActivity } from "./dashboard-activity"
import { DashboardCollections } from "./dashboard-collections"
import { DashboardContentLists } from "./dashboard-content-lists"
import { DashboardMetrics } from "./dashboard-metrics"
import { DashboardProfileCompleteness } from "./dashboard-profile-completeness"
import { DashboardSettingsTeam } from "./dashboard-settings-team"
import { DashboardSummaryCards } from "./dashboard-summary-cards"
import { DashboardVisitsCard } from "./dashboard-visits-card"
import { DesignSystemPanel } from "./design-system-panel"
import { PageEditorPanel } from "./page-editor-panel"
import { TemplateCatalog } from "./template-catalog"
import { ThemePicker } from "./theme-picker"

export function DashboardOverview() {
  return (
    <div id="overview" className="min-h-screen bg-[#f7f8fa]">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-5 py-7 sm:px-8 lg:px-10">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">Ringkasan website sekolah</p>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[28px]">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-500">Kelola informasi dan pantau profil sekolah Anda secara online.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm">
              <CalendarDays className="size-4 text-slate-400" />
              <span>Oktober 2026</span>
            </div>
            <Link
              href="/"
              target="_blank"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <Eye className="size-4" />
              Lihat website
            </Link>
          </div>
        </header>

        <section
          id="school-profile"
          aria-label="Profil sekolah"
          className="flex flex-col justify-between gap-5 rounded-2xl bg-slate-900 p-5 text-white shadow-sm sm:flex-row sm:items-center sm:p-6"
        >
          <div className="flex items-start gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
              <School className="size-7 text-violet-200" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold tracking-tight">SMA Cendekia Nusantara</h2>
                <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[10px] font-semibold text-emerald-300">
                  WEBSITE AKTIF
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-300">Sekolah Menengah Atas · Bandung, Jawa Barat</p>
              <p className="mt-3 max-w-2xl text-xs leading-relaxed text-slate-400">
                Profil, statistik, dan status konten di dashboard ini adalah contoh. Ganti dengan data aktual sekolah Anda.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard#school-profile"
            className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-3 text-xs font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            Kelola profil sekolah <ChevronRight className="size-4" />
          </Link>
        </section>

        <DashboardMetrics />

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.8fr)]">
          <DashboardVisitsCard />
          <DashboardProfileCompleteness />
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <DashboardContentLists />
          <DashboardActivity />
        </section>

        <DashboardSummaryCards />
        <DashboardCollections />
        <DashboardSettingsTeam />
        <TemplateCatalog />
        <DesignSystemPanel />
        <PageEditorPanel />
        <ThemePicker />
      </div>
    </div>
  )
}
