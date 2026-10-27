import type { ContentFeaturePresentation } from "@/types/type-cms-ui"

export const contentFeaturePresentations: ContentFeaturePresentation[] = [
  {
    key: "news",
    label: "Berita",
    noun: "berita",
    description: "Kelola berita sesuai field pada koleksi yang terhubung.",
    route: "/dashboard/cms/news",
  },
  {
    key: "staff",
    label: "Staf",
    noun: "staf",
    description: "Kelola pimpinan, guru, dosen, dan staf pengelola.",
    route: "/dashboard/cms/staff",
  },
  {
    key: "program",
    label: "Program",
    noun: "program",
    description: "Kelola program pembelajaran dan kegiatan unggulan lembaga.",
    route: "/dashboard/cms/program",
  },
  {
    key: "extracurricular",
    label: "Ekstrakurikuler",
    noun: "ekstrakurikuler",
    description: "Kelola kegiatan minat, bakat, dan organisasi siswa.",
    route: "/dashboard/cms/ekstrakurikuler",
  },
  {
    key: "facility",
    label: "Fasilitas",
    noun: "fasilitas",
    description: "Kelola sarana dan prasarana yang tersedia di lembaga.",
    route: "/dashboard/cms/fasilitas",
  },
  {
    key: "achievement",
    label: "Prestasi",
    noun: "prestasi",
    description: "Kelola capaian siswa, guru, dan lembaga.",
    route: "/dashboard/cms/prestasi",
  },
]

export function getContentFeaturePresentation(key: string) {
  return contentFeaturePresentations.find((presentation) => presentation.key === key)
}
