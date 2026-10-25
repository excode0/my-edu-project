import { ArrowRight, CheckCircle2, GraduationCap, School } from "lucide-react"

export function HomeHero({
  admissionEnabled,
  admissionStatus,
}: {
  admissionEnabled: boolean
  admissionStatus: string
}) {
  return (
    <section className="overflow-hidden bg-[#f8f7ff]">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1fr_0.9fr] lg:gap-16 lg:py-24">
        <div className="relative z-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-3 py-1.5 text-xs font-semibold text-violet-800">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            {admissionEnabled
              ? admissionStatus || "Membuka pendaftaran tahun ajaran 2026/2027"
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
  )
}
