import { Database, LayoutDashboard, Palette, School, Settings2, type LucideIcon } from "lucide-react"

export type SidebarChildConfig = {
  label: string
  href: string
  permission?: string
}

export type SidebarGroupConfig = {
  label: string
  icon: LucideIcon
  hrefBase: string
  children?: SidebarChildConfig[]
}

export const sidebarGroups: SidebarGroupConfig[] = [
  {
    label: "Beranda",
    icon: LayoutDashboard,
    hrefBase: "/dashboard",
  },
  {
    label: "Lembaga (Wajib)",
    icon: School,
    hrefBase: "/dashboard/cms/identity",
    children: [
      { label: "Identitas Sekolah", href: "/dashboard/cms/identity", permission: "identitas.update" },
      { label: "Pengguna & Role", href: "/dashboard/cms/users", permission: "user.manage" },
    ],
  },
  {
    label: "Konten Dinamis",
    icon: Database,
    hrefBase: "/dashboard/cms/collections",
    children: [
      { label: "Koleksi", href: "/dashboard/cms/collections", permission: "collection.fields.manage" },
      { label: "Artikel & Agenda", href: "/dashboard/cms/items", permission: "collection.items.create" },
      { label: "Form PPDB", href: "/dashboard/cms/submissions", permission: "submission.view" },
    ],
  },
  {
    label: "Halaman & Tampilan",
    icon: Palette,
    hrefBase: "/dashboard/cms/pages",
    children: [
      { label: "Halaman", href: "/dashboard/cms/pages", permission: "pages.manage" },
      { label: "Media", href: "/dashboard/cms/media", permission: "media.upload" },
      { label: "Template Library", href: "/dashboard/cms/templates", permission: "template.view" },
      { label: "Konfigurasi Template", href: "/dashboard/cms/template-config", permission: "template.config.manage" },
      { label: "Navigasi (Menu)", href: "/dashboard/cms/navigation", permission: "menu.manage" },
    ],
  },
  {
    label: "Pengaturan",
    icon: Settings2,
    hrefBase: "/dashboard/cms/settings",
    children: [
      { label: "Pengaturan Umum", href: "/dashboard/cms/settings", permission: "settings.manage" },
      { label: "Log Aktivitas", href: "/dashboard/cms/audit", permission: "audit.view" },
    ],
  },
]

const pageTitles: Record<string, string> = {
  "/dashboard": "Ringkasan",
  "/dashboard/cms": "Manajemen CMS",
  "/dashboard/cms/identity": "Identitas lembaga",
  "/dashboard/cms/users": "Pengguna & role",
  "/dashboard/cms/collections": "Koleksi & konten",
  "/dashboard/cms/items": "Artikel & agenda",
  "/dashboard/cms/submissions": "Form PPDB",
  "/dashboard/cms/pages": "Halaman",
  "/dashboard/cms/media": "Media",
  "/dashboard/cms/templates": "Template & binding",
  "/dashboard/cms/template-config": "Konfigurasi template",
  "/dashboard/cms/navigation": "Navigasi",
  "/dashboard/cms/settings": "Pengaturan",
  "/dashboard/cms/audit": "Log aktivitas",
}

export function getDashboardPageTitle(pathname: string) {
  return pageTitles[pathname] ?? (pathname.startsWith("/dashboard/cms") ? "Manajemen CMS" : "Ringkasan")
}
