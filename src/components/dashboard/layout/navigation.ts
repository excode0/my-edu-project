import { Database } from "lucide-react"
import type { SidebarChildConfig, SidebarGroupConfig } from "@/types/type-dashboard"
import { getContentBinding } from "@/lib/cms/content-bindings"
import { contentFeaturePresentations } from "@/components/dashboard/cms/content-presentations"

export const sidebarGroups: SidebarGroupConfig[] = [
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
    ],
  },
]

const pageTitles: Record<string, string> = {
  "/dashboard": "Koleksi",
  "/dashboard/cms": "Konten Dinamis",
  "/dashboard/cms/collections": "Koleksi",
  ...Object.fromEntries(contentFeaturePresentations.map((presentation) => [
    presentation.route,
    `Manajemen ${presentation.label.toLocaleLowerCase("id")}`,
  ])),
}

export function getDashboardPageTitle(pathname: string) {
  return pageTitles[pathname] ?? (pathname.startsWith("/dashboard/cms") ? "Konten Dinamis" : "Ringkasan")
}
