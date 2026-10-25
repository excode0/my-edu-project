import {
  Activity,
  BookOpen,
  FileImage,
  FileText,
  FolderKanban,
  LayoutTemplate,
  Menu,
  Newspaper,
  School,
  Settings2,
  ShieldCheck,
  Users,
} from "lucide-react"
import type { ModuleDefinition } from "../types"

export const modules: ModuleDefinition[] = [
  { key: "overview", label: "Ringkasan", description: "Ikhtisar konten dan aktivitas website.", icon: Activity },
  { key: "identity", label: "Identitas lembaga", description: "Data dasar, alamat, kontak, dan profil lembaga.", icon: School, permission: "identitas.update" },
  { key: "collections", label: "Koleksi & konten", description: "Definisi koleksi, field, dan item konten.", icon: FolderKanban, recordKey: "collections", noun: "koleksi", permission: "collection.fields.manage" },
  { key: "items", label: "Artikel & agenda", description: "Item berita yang tampil di website publik.", icon: Newspaper, recordKey: "items", noun: "artikel", permission: "collection.items.create" },
  { key: "pages", label: "Halaman", description: "Halaman profil, landing page, dan status publikasi.", icon: FileText, recordKey: "pages", noun: "halaman", permission: "pages.manage" },
  { key: "media", label: "Media", description: "Pustaka gambar, dokumen, dan file website.", icon: FileImage, recordKey: "media", noun: "media", permission: "media.upload" },
  { key: "templates", label: "Template & binding", description: "Registry tampilan, varian, dan pemetaan field.", icon: LayoutTemplate, recordKey: "templates", noun: "template", permission: "template.view" },
  { key: "navigation", label: "Navigasi", description: "Susunan menu header dan footer website.", icon: Menu, recordKey: "navigation", noun: "tautan menu", permission: "menu.manage" },
  { key: "submissions", label: "Form PPDB", description: "Data pendaftar dan tahapan peninjauan.", icon: BookOpen, recordKey: "submissions", noun: "pendaftar", permission: "submission.view" },
  { key: "users", label: "Pengguna & role", description: "Kelola akun dan peran akses.", icon: Users, recordKey: "users", noun: "pengguna", permission: "user.manage" },
  { key: "settings", label: "Pengaturan", description: "Preferensi website dan status penerimaan.", icon: Settings2, permission: "settings.manage" },
  { key: "audit", label: "Log aktivitas", description: "Riwayat perubahan administratif.", icon: ShieldCheck, permission: "audit.view" },
]

export function findModule(key: string) {
  return modules.find((module) => module.key === key)
}
