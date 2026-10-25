import { ArrowRight } from "lucide-react"

export function HomeAbout({
  schoolName,
  vision,
}: {
  schoolName: string
  vision: string
}) {
  return (
    <section id="tentang" className="scroll-mt-24 mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:py-24">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-700">Tentang sekolah</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Pendidikan yang melihat potensi setiap anak.</h2>
      </div>
      <div>
        <p className="text-base leading-7 text-slate-600">
          {vision || `${schoolName} adalah contoh profil lembaga pendidikan yang mengutamakan pembelajaran bermakna, karakter yang kuat, dan lingkungan sekolah yang aman. Setiap siswa didampingi untuk mengeksplorasi minat dan mempersiapkan langkah berikutnya.`}
        </p>
        <a href="#program" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-violet-700 hover:text-violet-900">
          Kenali program kami <ArrowRight className="size-4" />
        </a>
      </div>
    </section>
  )
}
