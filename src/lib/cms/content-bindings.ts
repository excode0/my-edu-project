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
  {
    key: "staff",
    collectionSlug: "staff",
    permission: "collection.items.create",
    titleField: "name",
    summaryField: "bio",
    imageField: "photo",
    requiredFields: ["name", "nip", "position"],
  },
  {
    key: "program",
    collectionSlug: "program",
    permission: "collection.items.create",
    titleField: "judul",
    summaryField: "ringkasan",
    bodyField: "isi",
    imageField: "foto",
    requiredFields: ["judul", "ringkasan"],
  },
  {
    key: "extracurricular",
    collectionSlug: "ekstrakurikuler",
    permission: "collection.items.create",
    titleField: "nama",
    summaryField: "deskripsi",
    imageField: "foto",
    requiredFields: ["nama", "deskripsi"],
  },
  {
    key: "facility",
    collectionSlug: "fasilitas",
    permission: "collection.items.create",
    titleField: "nama",
    summaryField: "deskripsi",
    imageField: "foto",
    requiredFields: ["nama", "deskripsi"],
  },
  {
    key: "achievement",
    collectionSlug: "prestasi",
    permission: "collection.items.create",
    titleField: "judul",
    summaryField: "ringkasan",
    bodyField: "isi",
    categoryField: "tingkat",
    dateField: "tanggal",
    imageField: "foto",
    requiredFields: ["judul", "ringkasan", "tanggal"],
  },
]

export function getContentBinding(key: string) {
  return contentBindings.find((binding) => binding.key === key)
}

export function getContentBindingForCollection(collectionSlug: string) {
  return contentBindings.find((binding) => binding.collectionSlug === collectionSlug)
}
