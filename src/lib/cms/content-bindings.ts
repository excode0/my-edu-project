import type { ContentBinding } from "@/types/type-cms"

// Feature-to-collection data mapping. Visual layout and controls are owned by components.
export const contentBindings: ContentBinding[] = [
  {
    key: "news",
    collectionSlug: "berita",
    permission: "collection.items.create",
    titleField: "judul",
    summaryField: "ringkasan",
    bodyField: "isi",
    categoryField: "kategori",
    dateField: "tanggal_terbit",
    requiredFields: ["judul", "ringkasan", "isi", "kategori", "tanggal_terbit"],
  },
]

export function getContentBinding(key: string) {
  return contentBindings.find((binding) => binding.key === key)
}

export function getContentBindingForCollection(collectionSlug: string) {
  return contentBindings.find((binding) => binding.collectionSlug === collectionSlug)
}
