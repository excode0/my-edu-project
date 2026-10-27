import {
  Activity,
  BookOpen,
  FileImage,
  FileText,
  FolderKanban,
  LayoutTemplate,
  Menu,
  Newspaper,
  Settings2,
  ShieldCheck,
  Users,
} from "lucide-react"
import { cmsModuleEngine } from "@/lib/cms/module-engine"
import type { ModuleKey } from "@/types/type-cms"
import type { CmsModuleView, ModulePresentation } from "@/types/type-cms-ui"

const presentations: Record<ModuleKey, Omit<ModulePresentation, "key">> = {
  overview: { label: "Ringkasan", description: "Ikhtisar konten dan aktivitas website.", icon: Activity },
  collections: { label: "Koleksi & konten", description: "Definisi koleksi, field, dan item konten.", icon: FolderKanban, noun: "koleksi" },
  items: { label: "Artikel & agenda", description: "Item berita yang tampil di website publik.", icon: Newspaper, noun: "artikel" },
  pages: { label: "Halaman", description: "Halaman profil, landing page, dan status publikasi.", icon: FileText, noun: "halaman" },
  media: { label: "Media", description: "Pustaka gambar, video, audio, dokumen, dan file website.", icon: FileImage, noun: "media" },
  templates: { label: "Template & binding", description: "Registry tampilan, varian, dan pemetaan field.", icon: LayoutTemplate, noun: "template" },
  navigation: { label: "Navigasi", description: "Susunan menu header dan footer website.", icon: Menu, noun: "tautan menu" },
  submissions: { label: "Form PPDB", description: "Data pendaftar dan tahapan peninjauan.", icon: BookOpen, noun: "pendaftar" },
  users: { label: "Pengguna & role", description: "Kelola akun dan peran akses.", icon: Users, noun: "pengguna" },
  settings: { label: "Pengaturan", description: "Preferensi website dan status penerimaan.", icon: Settings2 },
  audit: { label: "Log aktivitas", description: "Riwayat perubahan administratif.", icon: ShieldCheck },
}

export const modules: CmsModuleView[] = (Object.keys(presentations) as ModuleKey[]).map((key) => ({
  ...cmsModuleEngine[key],
  ...presentations[key],
  key,
}))

export function findModulePresentation(key: string): ModulePresentation | undefined {
  return modules.find((module) => module.key === key)
}
