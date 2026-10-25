import Link from "next/link"
import { Suspense } from "react"
import type { Metadata } from "next"
import {
  ArrowRight,
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  MapPin,
  Mail,
  Menu,
  Microscope,
  Music2,
  Phone,
  School,
  Sparkles,
  Trophy,
} from "lucide-react"
import { getPublicSiteData } from "@/lib/public-data"
import { AdmissionForm } from "./admission-form"

export async function generateMetadata(): Promise<Metadata> {
  const cms = await getPublicSiteData()
  return {
    title: cms.settings.siteTitle || `${cms.identity.name} | Profil Sekolah`,
    description: cms.settings.siteDescription || undefined,
  }
}

function getNewsCategory(fields: string) {
  return fields.match(/(?:^|·)\s*kategori:\s*([^·]+)/i)?.[1]?.trim() ?? "Kegiatan sekolah"
}

function getNewsDate(fields: string, fallback: string) {
  const date = fields.match(/tanggal_terbit:\s*(\d{4}-\d{2}-\d{2})/i)?.[1] ?? fallback
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date.slice(0, 10)}T12:00:00`))
}

const programs = [
  {
    title: "Sains & Teknologi",
    description: "Mengembangkan rasa ingin tahu, nalar ilmiah, dan keterampilan teknologi.",
    icon: Microscope,
    color: "bg-violet-100 text-violet-700",
  },
  {
    title: "Bahasa & Literasi",
    description: "Membangun kemampuan berkomunikasi dan wawasan lintas budaya.",
    icon: BookOpen,
    color: "bg-sky-100 text-sky-700",
  },
  {
    title: "Seni & Olahraga",
    description: "Memberi ruang bagi kreativitas, kebugaran, dan kerja sama.",
    icon: Music2,
    color: "bg-amber-100 text-amber-700",
  },
]

const achievements = [
  { title: "Juara 1 Olimpiade Sains tingkat Kota", category: "Akademik · 2026", icon: Trophy },
  { title: "Finalis Festival Inovasi Pelajar", category: "Inovasi · 2026", icon: Sparkles },
  { title: "Penghargaan Sekolah Adiwiyata", category: "Lingkungan · 2025", icon: Award },
]

export default function Home() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-white p-10 text-center text-sm text-slate-500">Memuat website sekolah...</main>}>
      <PublicHome />
    </Suspense>
  )
}

async function PublicHome() {
  const cms = await getPublicSiteData()
  const publicNews = cms.records.items.slice(0, 2)
  const schoolName = cms?.identity.name || "SMA Cendekia Nusantara"
  const shortName = cms?.identity.shortName || schoolName
  const schoolAddress = cms?.identity.address || "Jl. Pendidikan No. 1, Bandung"
  const schoolPhone = cms?.identity.phone || "(022) 555-0101"
  const currentYear = new Date().getFullYear()

  return (
    <main className="site-public min-h-screen bg-white text-slate-900">
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
            {cms.navigation.map((item) => <a key={`${item.label}-${item.href}`} href={item.href} className="text-sm font-medium text-slate-600 transition hover:text-violet-700">{item.label}</a>)}
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
                {[...cms.navigation, { label: "Panel admin", href: "/dashboard" }].map((item) => (
                  <a key={`${item.label}-${item.href}`} href={item.href} className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-violet-50 hover:text-violet-800">
                    {item.label}
                  </a>
                ))}
              </nav>
            </details>
          </div>
        </div>
      </header>

      <section className="overflow-hidden bg-[#f8f7ff]">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1fr_0.9fr] lg:gap-16 lg:py-24">
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-3 py-1.5 text-xs font-semibold text-violet-800">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              {cms.settings.admissionEnabled
                ? cms.settings.admissionStatus || "Membuka pendaftaran tahun ajaran 2026/2027"
                : "Pendaftaran sedang ditutup"}
            </span>
            <h1 className="mt-6 max-w-2xl text-4xl font-semibold leading-[1.12] tracking-tight text-slate-950 sm:text-5xl lg:text-[58px]">
              Belajar dengan rasa ingin tahu.{" "}
              <span className="text-violet-700">Bertumbuh dengan percaya diri.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
              Lingkungan belajar yang mendukung setiap siswa untuk menemukan potensi, mengembangkan karakter, dan mempersiapkan masa depan.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#pendaftaran" className="inline-flex h-12 items-center gap-2 rounded-lg bg-violet-700 px-5 text-sm font-semibold text-white shadow-sm shadow-violet-200 transition hover:bg-violet-800">
                Informasi pendaftaran <ArrowRight className="size-4" />
              </a>
              <a href="#tentang" className="inline-flex h-12 items-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                Kenali sekolah kami
              </a>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-4 border-t border-violet-200/80 pt-6">
              <div><p className="text-2xl font-semibold tracking-tight">1.200+</p><p className="mt-1 text-xs text-slate-500">siswa aktif</p></div>
              <div><p className="text-2xl font-semibold tracking-tight">86</p><p className="mt-1 text-xs text-slate-500">tenaga pendidik</p></div>
              <div><p className="text-2xl font-semibold tracking-tight">25 tahun</p><p className="mt-1 text-xs text-slate-500">mendampingi generasi</p></div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[520px]">
            <div className="absolute -right-12 -top-10 size-48 rounded-full bg-amber-200/60 blur-3xl" />
            <div className="absolute -bottom-10 -left-8 size-48 rounded-full bg-violet-300/50 blur-3xl" />
            <div className="relative overflow-hidden rounded-[28px] border border-white bg-gradient-to-br from-violet-800 via-violet-700 to-indigo-900 p-6 shadow-2xl shadow-violet-900/20 sm:p-8">
              <div className="absolute -right-12 -top-14 size-56 rounded-full border border-white/10" />
              <div className="absolute -right-2 -top-4 size-36 rounded-full border border-white/10" />
              <div className="relative flex items-center justify-between">
                <span className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-semibold tracking-[0.15em] text-violet-100">RUANG UNTUK BERTUMBUH</span>
                <GraduationCap className="size-6 text-violet-200" />
              </div>
              <div className="relative mt-12 flex h-56 items-end justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-sky-100/90 to-emerald-100/80">
                <div className="absolute inset-x-0 bottom-0 h-16 bg-emerald-700/15" />
                <div className="absolute bottom-0 left-7 h-24 w-12 rounded-t-full bg-emerald-700/20" />
                <div className="absolute bottom-0 right-9 h-32 w-16 rounded-t-full bg-emerald-700/20" />
                <div className="relative z-10 mb-0 flex h-40 w-[72%] flex-col items-center rounded-t-xl border-x-4 border-t-4 border-violet-900/80 bg-[#fffdf7] shadow-xl">
                  <div className="mt-3 flex size-8 items-center justify-center rounded-full bg-violet-100 text-violet-800"><School className="size-4" /></div>
                  <div className="mt-3 h-2 w-24 rounded-full bg-violet-200" />
                  <div className="mt-2 h-1.5 w-16 rounded-full bg-slate-200" />
                  <div className="mt-auto grid w-full grid-cols-4 gap-2 px-4">
                    {[0, 1, 2, 3].map((window) => <span key={window} className="h-9 rounded-t-md border border-sky-200 bg-sky-100" />)}
                  </div>
                  <div className="mt-2 h-9 w-10 rounded-t-full bg-violet-700" />
                </div>
              </div>
              <div className="relative mt-5 flex items-center justify-between gap-4 text-white">
                <div>
                  <p className="text-sm font-semibold">Tempat potensi berkembang</p>
                  <p className="mt-1 text-xs text-violet-200">Akademik · Karakter · Kolaborasi</p>
                </div>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10"><ArrowRight className="size-4" /></span>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-4 flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-lg sm:-left-7">
              <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700"><CheckCircle2 className="size-5" /></span>
              <span><span className="block text-xs font-semibold">Lingkungan suportif</span><span className="mt-1 block text-[10px] text-slate-500">Belajar dan berkembang bersama</span></span>
            </div>
          </div>
        </div>
      </section>

      <section id="tentang" className="scroll-mt-24 mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:py-24">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-700">Tentang sekolah</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Pendidikan yang melihat potensi setiap anak.</h2>
        </div>
        <div>
          <p className="text-base leading-7 text-slate-600">
            {cms?.identity.vision || `${schoolName} adalah contoh profil lembaga pendidikan yang mengutamakan pembelajaran bermakna, karakter yang kuat, dan lingkungan sekolah yang aman. Setiap siswa didampingi untuk mengeksplorasi minat dan mempersiapkan langkah berikutnya.`}
          </p>
          <a href="#program" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-violet-700 hover:text-violet-900">
            Kenali program kami <ArrowRight className="size-4" />
          </a>
        </div>
      </section>

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

      <section id="prestasi" className="scroll-mt-24 mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-700">Kabar baik dari sekolah</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Prestasi & cerita terbaru.</h2>
          </div>
          <a href="#berita" className="inline-flex items-center gap-1 text-sm font-semibold text-violet-700">Semua cerita <ArrowRight className="size-4" /></a>
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
          {publicNews.length ? publicNews.map((item, index) => (
            <article key={item.id} className={`rounded-2xl p-6 ${index % 2 ? "bg-sky-50" : "bg-violet-50"}`}>
              <p className={`text-xs font-semibold uppercase tracking-wide ${index % 2 ? "text-sky-700" : "text-violet-700"}`}>{getNewsCategory(item.fields)}</p>
              <h3 className="mt-3 text-lg font-semibold">{item.title}</h3>
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

      <section id="pendaftaran" className="scroll-mt-24 bg-violet-800 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-8 md:grid-cols-[0.8fr_1.2fr] md:py-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-200">Penerimaan siswa baru</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Mulai perjalanan belajar berikutnya bersama kami.</h2>
            {cms.settings.admissionEnabled
              ? <p className="mt-3 text-sm leading-6 text-violet-100">Isi formulir berikut. Sekolah akan menghubungi orang tua atau wali untuk tahapan selanjutnya.</p>
              : <p className="mt-3 text-sm leading-6 text-violet-100">Pendaftaran saat ini ditutup. Silakan hubungi sekolah untuk informasi lebih lanjut.</p>}
          </div>
          {cms.settings.admissionEnabled && <AdmissionForm fields={cms.admissionFields} />}
        </div>
      </section>

      <footer id="kontak" className="scroll-mt-24 bg-slate-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1fr_auto]">
          <div>
            <Link href="/" className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-violet-600"><School className="size-5" /></span>
              <span className="text-sm font-semibold">{shortName}</span>
            </Link>
            <p className="mt-4 max-w-md text-sm leading-6 text-slate-400">{cms?.identity.vision || `Profil ${schoolName} yang berkomitmen mendampingi siswa menjadi pembelajar sepanjang hayat.`}</p>
          </div>
          <div className="space-y-3 text-sm text-slate-300">
            <p className="font-semibold text-white">Hubungi sekolah</p>
            <p className="flex items-center gap-2"><MapPin className="size-4 text-violet-300" /> {schoolAddress}</p>
            <p className="flex items-center gap-2"><Phone className="size-4 text-violet-300" /> {schoolPhone}</p>
            {cms?.identity.email && <p className="flex items-center gap-2"><Mail className="size-4 text-violet-300" /> {cms.identity.email}</p>}
            <p className="flex items-center gap-2"><CalendarDays className="size-4 text-violet-300" /> Senin–Jumat, 08.00–15.00</p>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-2 px-5 py-4 text-[11px] text-slate-500 sm:px-8">
            <span>© {currentYear} {schoolName}. Seluruh hak cipta dilindungi.</span>
            <Link href="/dashboard" className="hover:text-white">Panel pengelola</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
