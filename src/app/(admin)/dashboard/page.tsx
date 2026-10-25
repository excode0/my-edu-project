import Link from "next/link"
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Database,
  Eye,
  FileText,
  GraduationCap,
  Image as ImageIcon,
  Mail,
  MoreHorizontal,
  Plus,
  School,
  UserRound,
  UsersRound,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemePicker } from "./theme-picker"
import {
  DesignSystemPanel,
  PageEditorPanel,
  TemplateCatalog,
} from "./visual-management"

const metrics = [
  {
    label: "Kunjungan website",
    value: "2.840",
    change: "+18,6%",
    note: "dibanding bulan lalu",
    icon: Eye,
    color: "bg-violet-100 text-violet-700",
  },
  {
    label: "Siswa terdaftar",
    value: "1.248",
    change: "+3,2%",
    note: "tahun ajaran 2026/2027",
    icon: UsersRound,
    color: "bg-sky-100 text-sky-700",
  },
  {
    label: "Tenaga pendidik",
    value: "86",
    change: "+2 baru",
    note: "guru dan staf sekolah",
    icon: UserRound,
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    label: "Pesan masuk",
    value: "12",
    change: "4 belum dibaca",
    note: "pertanyaan dari pengunjung",
    icon: Mail,
    color: "bg-amber-100 text-amber-700",
  },
]

const staticContentItems = [
  { title: "Profil & identitas sekolah", status: "Terbit", color: "bg-emerald-100 text-emerald-700", icon: School, id: "school-profile" },
  { title: "Program pendidikan", status: "Terbit", color: "bg-emerald-100 text-emerald-700", icon: GraduationCap, id: "programs" },
  { title: "Tenaga pendidik", status: "Perlu ditinjau", color: "bg-amber-100 text-amber-700", icon: UsersRound, id: "teachers" },
]

const dynamicContentItems = [
  { title: "Berita & kegiatan", status: "Draf", color: "bg-slate-100 text-slate-600", icon: FileText, id: "news" },
  { title: "Prestasi sekolah", status: "Terbit", color: "bg-emerald-100 text-emerald-700", icon: GraduationCap, id: "achievements" },
  { title: "Penerimaan siswa baru", status: "Perlu diperbarui", color: "bg-amber-100 text-amber-700", icon: CalendarDays, id: "admissions" },
  { title: "Galeri & agenda", status: "Terbit", color: "bg-emerald-100 text-emerald-700", icon: ImageIcon, id: "gallery" },
]

const activities = [
  { title: "Galeri kegiatan sekolah diperbarui", detail: "Galeri media · oleh Admin Sekolah", time: "10 menit lalu", icon: ImageIcon, color: "bg-violet-100 text-violet-700" },
  { title: "Informasi pendaftaran siswa baru ditinjau", detail: "Penerimaan siswa · oleh Admin Sekolah", time: "1 jam lalu", icon: Check, color: "bg-emerald-100 text-emerald-700" },
  { title: "Prestasi sekolah ditambahkan", detail: "Prestasi · oleh Editor Konten", time: "Kemarin", icon: GraduationCap, color: "bg-sky-100 text-sky-700" },
]

function ContentItemList({
  items,
}: {
  items: { title: string; status: string; color: string; icon: LucideIcon; id: string }[]
}) {
  return (
    <div className="space-y-2 px-5 pb-5 sm:px-6">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <Link
            key={item.title}
            href={`/dashboard#${item.id}`}
            className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-violet-200 hover:bg-violet-50/30"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <Icon className="size-4" />
            </div>
            <p className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
              {item.title}
            </p>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${item.color}`}>
              {item.status}
            </span>
            <ChevronRight className="hidden size-4 text-slate-300 sm:block" />
          </Link>
        )
      })}
    </div>
  )
}

function VisitsChart() {
  return (
    <div className="mt-5">
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-violet-600" />
          Kunjungan website
        </span>
      </div>
      <div className="mt-5 flex gap-3">
        <div className="flex h-44 flex-col justify-between pb-6 text-[10px] text-slate-400">
          <span>3.000</span>
          <span>2.250</span>
          <span>1.500</span>
          <span>750</span>
          <span>0</span>
        </div>
        <div className="relative min-w-0 flex-1">
          <div className="absolute inset-0 mb-6 flex flex-col justify-between" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((line) => (
              <div key={line} className="border-t border-dashed border-slate-200" />
            ))}
          </div>
          <svg
            viewBox="0 0 640 160"
            preserveAspectRatio="none"
            className="relative h-36 w-full overflow-visible"
            role="img"
            aria-label="Grafik kunjungan situs profil sekolah meningkat selama enam bulan terakhir"
          >
            <defs>
              <linearGradient id="visits-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#7c3aed" stopOpacity=".18" />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0 126 C45 118 55 100 107 106 S170 82 213 92 S277 59 320 69 S383 51 427 57 S490 34 533 43 S597 13 640 19 L640 160 L0 160Z"
              fill="url(#visits-fill)"
            />
            <path
              d="M0 126 C45 118 55 100 107 106 S170 82 213 92 S277 59 320 69 S383 51 427 57 S490 34 533 43 S597 13 640 19"
              fill="none"
              stroke="#7c3aed"
              strokeWidth="3"
              vectorEffect="non-scaling-stroke"
            />
            <circle cx="640" cy="19" r="4" fill="#7c3aed" />
          </svg>
          <div className="absolute inset-x-0 bottom-0 flex justify-between text-[10px] text-slate-400">
            {["Mei", "Jun", "Jul", "Agu", "Sep", "Okt"].map((month) => (
              <span key={month}>{month}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
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

        <section id="analytics" aria-label="Ringkasan statistik" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon
            return (
              <Card key={metric.label} className="border-0 bg-white shadow-sm shadow-slate-200/60">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className={`flex size-10 items-center justify-center rounded-xl ${metric.color}`}>
                      <Icon className="size-5" />
                    </div>
                    <button type="button" aria-label={`Opsi ${metric.label}`} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100">
                      <MoreHorizontal className="size-4" />
                    </button>
                  </div>
                  <p className="mt-4 text-sm text-slate-500">{metric.label}</p>
                  <div className="mt-1 flex flex-wrap items-end justify-between gap-2">
                    <p className="text-2xl font-semibold tracking-tight text-slate-900">{metric.value}</p>
                    <span className="mb-0.5 inline-flex items-center gap-0.5 text-xs font-medium text-emerald-700">
                      <ArrowUpRight className="size-3.5" />
                      {metric.change}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{metric.note}</p>
                </CardContent>
              </Card>
            )
          })}
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.8fr)]">
          <Card className="border-0 bg-white shadow-sm shadow-slate-200/60">
            <CardHeader className="flex flex-row items-start justify-between gap-3 px-5 pt-5 sm:px-6">
              <div>
                <CardTitle className="text-base font-semibold">Kunjungan website</CardTitle>
                <p className="mt-1 text-sm text-slate-500">Minat pengunjung terhadap profil sekolah</p>
              </div>
              <span className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500">6 bulan</span>
            </CardHeader>
            <CardContent className="px-5 pb-5 sm:px-6">
              <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-500">Total kunjungan</p>
                  <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">2.840</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  <ArrowUpRight className="size-3.5" />
                  18,6% dari periode lalu
                </span>
              </div>
              <VisitsChart />
            </CardContent>
          </Card>

          <Card className="border-0 bg-white shadow-sm shadow-slate-200/60">
            <CardHeader className="px-5 pt-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Kelengkapan profil</CardTitle>
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">Perlu ditinjau</span>
              </div>
              <p className="text-sm text-slate-500">Informasi yang tampil di website publik</p>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="mt-4 flex items-center gap-4">
                <div className="relative flex size-[76px] shrink-0 items-center justify-center rounded-full" style={{ background: "conic-gradient(#7c3aed 0% 82%, #ede9fe 82% 100%)" }}>
                  <div className="flex size-[58px] items-center justify-center rounded-full bg-white text-lg font-semibold text-slate-900">82%</div>
                </div>
                <p className="text-sm leading-relaxed text-slate-600">Profil sekolah sudah cukup lengkap. Tambahkan beberapa informasi untuk membangun kepercayaan calon siswa dan orang tua.</p>
              </div>
              <div className="mt-5 space-y-3">
                {[
                  { label: "Identitas & kontak sekolah", done: true },
                  { label: "Program pendidikan", done: true },
                  { label: "Profil tenaga pendidik", done: false },
                  { label: "Foto fasilitas & lingkungan", done: false },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2.5 text-xs">
                    <span className={`flex size-4 items-center justify-center rounded-full ${item.done ? "bg-emerald-100 text-emerald-700" : "border border-slate-300 text-transparent"}`}>
                      <Check className="size-3" />
                    </span>
                    <span className={item.done ? "text-slate-600" : "text-slate-500"}>{item.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <div className="grid content-start gap-5">
            <Card className="border-0 bg-white shadow-sm shadow-slate-200/60">
              <CardHeader className="px-5 pt-5 sm:px-6">
                <CardTitle className="text-base font-semibold">Halaman statis</CardTitle>
                <p className="text-sm text-slate-500">Informasi inti yang berubah sesekali.</p>
              </CardHeader>
              <CardContent className="p-0">
                <ContentItemList items={staticContentItems} />
              </CardContent>
            </Card>

            <Card className="border-0 bg-white shadow-sm shadow-slate-200/60">
              <CardHeader className="px-5 pt-5 sm:px-6">
                <CardTitle className="text-base font-semibold">Konten berkala</CardTitle>
                <p className="text-sm text-slate-500">Publikasi yang diperbarui secara berkala.</p>
              </CardHeader>
              <CardContent className="p-0">
                <ContentItemList items={dynamicContentItems} />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-1">
            <Card id="activity" className="border-0 bg-white shadow-sm shadow-slate-200/60">
              <CardHeader className="flex flex-row items-center justify-between px-5 pt-5">
                <div>
                  <CardTitle className="text-base font-semibold">Aktivitas terbaru</CardTitle>
                  <p className="mt-1 text-sm text-slate-500">Pembaruan konten website</p>
                </div>
                <Clock3 className="size-4 text-slate-400" />
              </CardHeader>
              <CardContent className="space-y-4 px-5 pb-5">
                {activities.map((activity) => {
                  const Icon = activity.icon
                  return (
                    <div key={activity.title} className="flex items-start gap-3">
                      <div className={`flex size-9 shrink-0 items-center justify-center rounded-full ${activity.color}`}>
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-snug text-slate-800">{activity.title}</p>
                        <p className="mt-1 text-xs text-slate-500">{activity.detail}</p>
                      </div>
                      <span className="shrink-0 pt-0.5 text-[10px] text-slate-400">{activity.time}</span>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Card id="messages" className="border-0 bg-white shadow-sm shadow-slate-200/60">
              <CardHeader className="px-5 pt-5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Pesan pengunjung</CardTitle>
                  <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-medium text-violet-700">4 baru</span>
                </div>
                <p className="text-sm text-slate-500">Pertanyaan dari calon siswa dan orang tua</p>
              </CardHeader>
              <CardContent className="pb-5">
                <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-700">AR</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800">Informasi pendaftaran siswa baru</p>
                    <p className="mt-1 text-xs text-slate-500">Apakah pendaftaran tahun ajaran baru sudah dibuka?</p>
                    <p className="mt-2 text-[10px] text-slate-400">Aulia Rahma · 25 menit lalu</p>
                  </div>
                </div>
                <Link href="/dashboard#admissions" className="mt-3 flex items-center justify-center gap-1 text-xs font-semibold text-violet-700 hover:text-violet-900">
                  Lihat semua pesan <ChevronRight className="size-3.5" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>

        <section aria-label="Ringkasan data profil sekolah" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <Card id="programs" className="border-0 bg-white shadow-sm shadow-slate-200/60">
            <CardContent className="p-5">
              <GraduationCap className="size-5 text-violet-700" />
              <p className="mt-3 text-sm font-semibold text-slate-800">Program pendidikan</p>
              <p className="mt-1 text-xs text-slate-500">Kelola program dan keunggulan sekolah.</p>
              <p className="mt-3 text-xs font-medium text-slate-500">3 program ditampilkan</p>
            </CardContent>
          </Card>
          <Card id="teachers" className="border-0 bg-white shadow-sm shadow-slate-200/60">
            <CardContent className="p-5">
              <UsersRound className="size-5 text-sky-700" />
              <p className="mt-3 text-sm font-semibold text-slate-800">Tenaga pendidik</p>
              <p className="mt-1 text-xs text-slate-500">Perkenalkan guru dan staf sekolah.</p>
              <p className="mt-3 text-xs font-medium text-slate-500">86 profil pendidik</p>
            </CardContent>
          </Card>
          <Card id="achievements" className="border-0 bg-white shadow-sm shadow-slate-200/60">
            <CardContent className="p-5">
              <GraduationCap className="size-5 text-emerald-700" />
              <p className="mt-3 text-sm font-semibold text-slate-800">Prestasi sekolah</p>
              <p className="mt-1 text-xs text-slate-500">Tampilkan pencapaian siswa dan sekolah.</p>
              <p className="mt-3 text-xs font-medium text-slate-500">12 prestasi dipublikasikan</p>
            </CardContent>
          </Card>
          <Card id="news" className="border-0 bg-white shadow-sm shadow-slate-200/60">
            <CardContent className="p-5">
              <FileText className="size-5 text-amber-700" />
              <p className="mt-3 text-sm font-semibold text-slate-800">Berita & kegiatan</p>
              <p className="mt-1 text-xs text-slate-500">Bagikan kabar terbaru warga sekolah.</p>
              <p className="mt-3 text-xs font-medium text-slate-500">8 artikel aktif</p>
            </CardContent>
          </Card>
          <Card id="admissions" className="border-0 bg-white shadow-sm shadow-slate-200/60">
            <CardContent className="p-5">
              <CalendarDays className="size-5 text-rose-700" />
              <p className="mt-3 text-sm font-semibold text-slate-800">Penerimaan siswa baru</p>
              <p className="mt-1 text-xs text-slate-500">Informasi jadwal dan alur pendaftaran.</p>
              <p className="mt-3 text-xs font-medium text-slate-500">Informasi perlu diperbarui</p>
            </CardContent>
          </Card>
          <Card id="events" className="border-0 bg-white shadow-sm shadow-slate-200/60">
            <CardContent className="p-5">
              <CalendarDays className="size-5 text-sky-700" />
              <p className="mt-3 text-sm font-semibold text-slate-800">Agenda & kegiatan</p>
              <p className="mt-1 text-xs text-slate-500">Jadwal acara dan aktivitas sekolah terkini.</p>
              <p className="mt-3 text-xs font-medium text-slate-500">3 agenda mendatang</p>
            </CardContent>
          </Card>
          <Card id="gallery" className="border-0 bg-white shadow-sm shadow-slate-200/60">
            <CardContent className="p-5">
              <ImageIcon className="size-5 text-indigo-700" />
              <p className="mt-3 text-sm font-semibold text-slate-800">Galeri sekolah</p>
              <p className="mt-1 text-xs text-slate-500">Foto kegiatan, fasilitas, dan lingkungan.</p>
              <p className="mt-3 text-xs font-medium text-slate-500">24 foto ditampilkan</p>
            </CardContent>
          </Card>
        </section>

        <section
          id="collections"
          aria-labelledby="collections-title"
          className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 shadow-sm shadow-slate-200/40 sm:p-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <Database className="size-4" />
              </span>
              <div>
                <h2 id="collections-title" className="text-base font-semibold text-slate-900">
                  Koleksi tambahan <span className="font-normal text-slate-400">(opsional)</span>
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">
                  Data di luar profil inti sekolah. Tambahkan koleksi hanya ketika sekolah membutuhkan halaman atau informasi baru.
                </p>
              </div>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-500">
              Belum ada koleksi aktif
            </span>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Ekstrakurikuler", "Untuk halaman kegiatan dan minat siswa"],
              ["Alumni", "Untuk direktori atau cerita alumni"],
              ["Beasiswa", "Untuk informasi bantuan pendidikan"],
              ["Unit layanan", "Untuk layanan khusus milik sekolah"],
            ].map(([title, description]) => (
              <div key={title} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-700">{title}</p>
                  <span className="rounded-full bg-white px-2 py-1 text-[9px] font-medium text-slate-400">
                    Opsional
                  </span>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{description}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-slate-500">
            <Plus className="mt-0.5 size-3.5 shrink-0 text-violet-600" />
            Koleksi contoh ini belum dibuat sebagai data aktif. Nantinya admin dapat menambahkan koleksi sesuai halaman tambahan yang dibutuhkan.
          </p>
        </section>

        <section aria-label="Pengaturan dan tim" className="grid gap-5 md:grid-cols-2">
          <Card id="site-settings" className="border-0 bg-white shadow-sm shadow-slate-200/60">
            <CardHeader className="px-5 pt-5">
              <CardTitle className="text-base font-semibold">Struktur & konfigurasi situs</CardTitle>
              <p className="text-sm text-slate-500">Pengaturan teknis untuk mendukung pertumbuhan website.</p>
            </CardHeader>
            <CardContent className="space-y-3 px-5 pb-5">
              {[
                ["Navigasi & struktur halaman", "Kelola menu utama dan urutan halaman"],
                ["SEO & metadata", "Judul, deskripsi, dan berbagi sosial"],
                ["Domain & integrasi", "Domain sekolah dan layanan terhubung"],
              ].map(([title, description]) => (
                <div key={title} className="flex items-start gap-3 rounded-lg border border-slate-100 p-3">
                  <span className="mt-0.5 size-2 rounded-full bg-amber-400" />
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{title}</p>
                    <p className="mt-1 text-[11px] text-slate-500">{description}</p>
                  </div>
                  <span className="ml-auto rounded-full bg-slate-100 px-2 py-1 text-[10px] text-slate-500">Pengembangan</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card id="team" className="border-0 bg-white shadow-sm shadow-slate-200/60">
            <CardHeader className="px-5 pt-5">
              <CardTitle className="text-base font-semibold">Pengguna & peran</CardTitle>
              <p className="text-sm text-slate-500">Struktur akses yang siap untuk kolaborasi tim.</p>
            </CardHeader>
            <CardContent className="space-y-3 px-5 pb-5">
              {[
                ["Administrator", "Mengelola pengaturan dan seluruh konten", "1 pengguna"],
                ["Editor konten", "Membuat dan memperbarui publikasi", "2 pengguna"],
                ["Kontributor", "Mengirim draf berita dan kegiatan", "Pengembangan"],
              ].map(([role, description, count]) => (
                <div key={role} className="flex items-center gap-3 rounded-lg border border-slate-100 p-3">
                  <div className="flex size-8 items-center justify-center rounded-full bg-violet-50 text-violet-700">
                    <UsersRound className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-800">{role}</p>
                    <p className="mt-1 text-[11px] text-slate-500">{description}</p>
                  </div>
                  <span className="shrink-0 text-[10px] text-slate-500">{count}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <TemplateCatalog />
        <DesignSystemPanel />
        <PageEditorPanel />
        <ThemePicker />
      </div>
    </div>
  )
}
