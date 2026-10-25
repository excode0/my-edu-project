import type { CmsIdentityFieldGroup } from "@/types/type-cms-ui"

export const identityFieldGroups: CmsIdentityFieldGroup[] = [
  {
    title: "Profil lembaga",
    description: "Nama resmi dan informasi dasar yang ditampilkan di website.",
    fields: [
      { key: "name", label: "Nama lembaga", required: true },
      { key: "shortName", label: "Nama singkat" },
      { key: "level", label: "Jenjang & status", type: "text" },
      { key: "accreditation", label: "Akreditasi" },
      { key: "npsn", label: "NPSN" },
      { key: "nss", label: "NSS" },
      { key: "tahunBerdiri", label: "Tahun berdiri" },
      { key: "slogan", label: "Slogan" },
      { key: "kepalaLembaga", label: "Kepala lembaga" },
    ],
  },
  {
    title: "Kontak",
    description: "Kanal yang bisa digunakan masyarakat untuk menghubungi lembaga.",
    fields: [
      { key: "phone", label: "Telepon", type: "tel" },
      { key: "whatsapp", label: "WhatsApp", type: "tel" },
      { key: "email", label: "Email", type: "email" },
      { key: "website", label: "Website", type: "url" },
    ],
  },
  {
    title: "Alamat",
    description: "Alamat lengkap untuk profil dan halaman kontak.",
    fields: [
      { key: "address", label: "Alamat jalan", multiline: true },
      { key: "kelurahan", label: "Kelurahan" },
      { key: "kecamatan", label: "Kecamatan" },
      { key: "kota", label: "Kota / kabupaten" },
      { key: "provinsi", label: "Provinsi" },
      { key: "kodePos", label: "Kode pos" },
    ],
  },
  {
    title: "Tentang lembaga",
    description: "Narasi yang membentuk profil dan arah lembaga.",
    fields: [
      { key: "vision", label: "Visi", multiline: true },
      { key: "misi", label: "Misi", multiline: true },
      { key: "sejarahSingkat", label: "Sejarah singkat", multiline: true },
    ],
  },
]
