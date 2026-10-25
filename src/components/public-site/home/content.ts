import { Award, BookOpen, Microscope, Music2, Sparkles, Trophy } from "lucide-react"

export const programs = [
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

export const achievements = [
  { title: "Juara 1 Olimpiade Sains tingkat Kota", category: "Akademik · 2026", icon: Trophy },
  { title: "Finalis Festival Inovasi Pelajar", category: "Inovasi · 2026", icon: Sparkles },
  { title: "Penghargaan Sekolah Adiwiyata", category: "Lingkungan · 2025", icon: Award },
]

export function getNewsCategory(fields: string) {
  return fields.match(/(?:^|·)\s*kategori:\s*([^·]+)/i)?.[1]?.trim() ?? "Kegiatan sekolah"
}

export function getNewsDate(fields: string, fallback: string) {
  const date = fields.match(/tanggal_terbit:\s*(\d{4}-\d{2}-\d{2})/i)?.[1] ?? fallback
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date.slice(0, 10)}T12:00:00`))
}
