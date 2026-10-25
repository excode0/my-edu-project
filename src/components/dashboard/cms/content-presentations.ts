import type { ContentFeaturePresentation } from "@/types/type-cms-ui"

export const contentFeaturePresentations: ContentFeaturePresentation[] = [
  {
    key: "news",
    label: "Berita",
    noun: "berita",
    description: "Kelola berita sesuai field pada koleksi yang terhubung.",
    route: "/dashboard/cms/news",
  },
]

export function getContentFeaturePresentation(key: string) {
  return contentFeaturePresentations.find((presentation) => presentation.key === key)
}
