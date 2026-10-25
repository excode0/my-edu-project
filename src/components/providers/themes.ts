import type { SiteTheme, SiteThemePalette } from "@/types/type-theme"

export const siteThemes: Record<SiteTheme, SiteThemePalette> = {
  violet: {
    name: "Ungu Cendekia",
    accent: "#6d28d9",
    hover: "#5b21b6",
    soft: "#f5f3ff",
    text: "#5b21b6",
  },
  ocean: {
    name: "Biru Bahari",
    accent: "#0369a1",
    hover: "#075985",
    soft: "#f0f9ff",
    text: "#075985",
  },
  forest: {
    name: "Hijau Akademik",
    accent: "#047857",
    hover: "#065f46",
    soft: "#ecfdf5",
    text: "#065f46",
  },
  amber: {
    name: "Emas Prestasi",
    accent: "#b45309",
    hover: "#92400e",
    soft: "#fffbeb",
    text: "#92400e",
  },
}
