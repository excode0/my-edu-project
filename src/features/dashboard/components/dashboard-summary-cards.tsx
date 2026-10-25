import { CalendarDays, FileText, GraduationCap, Image as ImageIcon, UsersRound } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const summaries = [
  {
    id: "programs",
    icon: GraduationCap,
    iconClass: "text-violet-700",
    title: "Program pendidikan",
    description: "Kelola program dan keunggulan sekolah.",
    detail: "3 program ditampilkan",
  },
  {
    id: "teachers",
    icon: UsersRound,
    iconClass: "text-sky-700",
    title: "Tenaga pendidik",
    description: "Perkenalkan guru dan staf sekolah.",
    detail: "86 profil pendidik",
  },
  {
    id: "achievements",
    icon: GraduationCap,
    iconClass: "text-emerald-700",
    title: "Prestasi sekolah",
    description: "Tampilkan pencapaian siswa dan sekolah.",
    detail: "12 prestasi dipublikasikan",
  },
  {
    id: "news",
    icon: FileText,
    iconClass: "text-amber-700",
    title: "Berita & kegiatan",
    description: "Bagikan kabar terbaru warga sekolah.",
    detail: "8 artikel aktif",
  },
  {
    id: "admissions",
    icon: CalendarDays,
    iconClass: "text-rose-700",
    title: "Penerimaan siswa baru",
    description: "Informasi jadwal dan alur pendaftaran.",
    detail: "Informasi perlu diperbarui",
  },
  {
    id: "events",
    icon: CalendarDays,
    iconClass: "text-sky-700",
    title: "Agenda & kegiatan",
    description: "Jadwal acara dan aktivitas sekolah terkini.",
    detail: "3 agenda mendatang",
  },
  {
    id: "gallery",
    icon: ImageIcon,
    iconClass: "text-indigo-700",
    title: "Galeri sekolah",
    description: "Foto kegiatan, fasilitas, dan lingkungan.",
    detail: "24 foto ditampilkan",
  },
]

export function DashboardSummaryCards() {
  return (
    <section aria-label="Ringkasan data profil sekolah" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {summaries.map((summary) => {
        const Icon = summary.icon
        return (
          <Card key={summary.id} id={summary.id} className="border-0 bg-white shadow-sm shadow-slate-200/60">
            <CardContent className="p-5">
              <Icon className={`size-5 ${summary.iconClass}`} />
              <p className="mt-3 text-sm font-semibold text-slate-800">{summary.title}</p>
              <p className="mt-1 text-xs text-slate-500">{summary.description}</p>
              <p className="mt-3 text-xs font-medium text-slate-500">{summary.detail}</p>
            </CardContent>
          </Card>
        )
      })}
    </section>
  )
}
