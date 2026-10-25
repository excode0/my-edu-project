import {
  CalendarDays,
  Check,
  Eye,
  FileText,
  GraduationCap,
  Image as ImageIcon,
  Mail,
  School,
  UserRound,
  UsersRound,
} from "lucide-react"

export const metrics = [
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

export const staticContentItems = [
  { title: "Profil & identitas sekolah", status: "Terbit", color: "bg-emerald-100 text-emerald-700", icon: School, id: "school-profile" },
  { title: "Program pendidikan", status: "Terbit", color: "bg-emerald-100 text-emerald-700", icon: GraduationCap, id: "programs" },
  { title: "Tenaga pendidik", status: "Perlu ditinjau", color: "bg-amber-100 text-amber-700", icon: UsersRound, id: "teachers" },
]

export const dynamicContentItems = [
  { title: "Berita & kegiatan", status: "Draf", color: "bg-slate-100 text-slate-600", icon: FileText, id: "news" },
  { title: "Prestasi sekolah", status: "Terbit", color: "bg-emerald-100 text-emerald-700", icon: GraduationCap, id: "achievements" },
  { title: "Penerimaan siswa baru", status: "Perlu diperbarui", color: "bg-amber-100 text-amber-700", icon: CalendarDays, id: "admissions" },
  { title: "Galeri & agenda", status: "Terbit", color: "bg-emerald-100 text-emerald-700", icon: ImageIcon, id: "gallery" },
]

export const activities = [
  { title: "Galeri kegiatan sekolah diperbarui", detail: "Galeri media · oleh Admin Sekolah", time: "10 menit lalu", icon: ImageIcon, color: "bg-violet-100 text-violet-700" },
  { title: "Informasi pendaftaran siswa baru ditinjau", detail: "Penerimaan siswa · oleh Admin Sekolah", time: "1 jam lalu", icon: Check, color: "bg-emerald-100 text-emerald-700" },
  { title: "Prestasi sekolah ditambahkan", detail: "Prestasi · oleh Editor Konten", time: "Kemarin", icon: GraduationCap, color: "bg-sky-100 text-sky-700" },
]
