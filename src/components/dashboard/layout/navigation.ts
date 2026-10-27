import { Database, School } from "lucide-react"
import type { SidebarChildConfig, SidebarGroupConfig } from "@/types/type-dashboard"
import { getContentBinding } from "@/lib/cms/content-bindings"
import { contentFeaturePresentations } from "@/components/dashboard/cms/content-presentations"

export const sidebarGroups: SidebarGroupConfig[] = [
  {
    label: "Identitas Lembaga",
    icon: School,
    hrefBase: "/dashboard/identitas",
    permission: "identitas.update",
  },
  {
    label: "Konten Dinamis",
    icon: Database,
    hrefBase: "/dashboard/cms/collections",
    children: [
      { label: "Koleksi", href: "/dashboard/cms/collections", permission: "collection.fields.manage" },
      ...contentFeaturePresentations.flatMap((presentation): SidebarChildConfig[] => {
        const binding = getContentBinding(presentation.key)
        return binding ? [{ label: presentation.label, href: presentation.route, permission: binding.permission }] : []
      }),
      { label: "Media", href: "/dashboard/cms/media", permission: "media.upload" },
    ],
  },
]

const pageTitles: Record<string, string> = {
  "/dashboard": "Koleksi",
  "/dashboard/identitas": "Identitas Lembaga",
  "/dashboard/cms": "Konten Dinamis",
  "/dashboard/cms/collections": "Koleksi",
  "/dashboard/cms/media": "Media",
  ...Object.fromEntries(contentFeaturePresentations.map((presentation) => [
    presentation.route,
    `Manajemen ${presentation.label.toLocaleLowerCase("id")}`,
  ])),
}

export function getDashboardPageTitle(pathname: string) {
  return pageTitles[pathname] ?? (pathname.startsWith("/dashboard/cms") ? "Konten Dinamis" : "Ringkasan")
}
