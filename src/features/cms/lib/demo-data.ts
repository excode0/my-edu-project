import type { CmsData } from "../types"

export const initialRecords: CmsData["records"] = {
  collections: [
    { id: "collection-news", title: "Berita & kegiatan", slug: "berita", description: "Artikel, kabar sekolah, dan kegiatan siswa.", fields: "judul, ringkasan, isi, gambar_utama, tanggal_terbit", status: "Terbit", updatedAt: "2026-10-24T09:30:00.000Z" },
    { id: "collection-achievements", title: "Prestasi", slug: "prestasi", description: "Pencapaian akademik dan non-akademik.", fields: "judul, kategori, tingkat, tahun", status: "Terbit", updatedAt: "2026-10-22T08:00:00.000Z" },
    { id: "collection-gallery", title: "Galeri", slug: "galeri", description: "Dokumentasi kegiatan sekolah.", fields: "judul, deskripsi, foto, tanggal", status: "Terbit", updatedAt: "2026-10-20T04:00:00.000Z" },
    { id: "collection-ppdb", title: "Penerimaan siswa baru", slug: "ppdb", description: "Formulir pendaftaran tahun ajaran 2026/2027.", fields: "nama_siswa, email, telepon, asal_sekolah", status: "Draf", updatedAt: "2026-10-18T04:00:00.000Z" },
  ],
  items: [
    { id: "news-creative-week", title: "Pekan kreativitas siswa kembali hadir", slug: "pekan-kreativitas-siswa", description: "Satu pekan untuk berbagi karya, mencoba hal baru, dan berkolaborasi bersama komunitas sekolah.", fields: "kategori: Kegiatan sekolah · tanggal_terbit: 2026-10-12 · durasi: 3 menit membaca", status: "Terbit", updatedAt: "2026-10-12T04:00:00.000Z" },
    { id: "news-learning-support", title: "Kenali program pendampingan belajar", slug: "program-pendampingan-belajar", description: "Sesi pendampingan membantu siswa menyusun strategi belajar dan mengembangkan potensi diri.", fields: "kategori: Info akademik · tanggal_terbit: 2026-10-04 · durasi: 4 menit membaca", status: "Terbit", updatedAt: "2026-10-04T04:00:00.000Z" },
  ],
  pages: [
    { id: "page-home", title: "Beranda", slug: "/", description: "Halaman utama profil sekolah.", fields: "hero, tentang, program, prestasi, kontak", status: "Terbit", updatedAt: "2026-10-24T09:30:00.000Z" },
    { id: "page-profile", title: "Profil sekolah", slug: "/profil", description: "Sejarah, visi, misi, dan identitas lembaga.", fields: "template: page.profile · SEO aktif", status: "Terbit", updatedAt: "2026-10-21T07:00:00.000Z" },
    { id: "page-news", title: "Daftar berita", slug: "/berita", description: "Daftar artikel dari koleksi Berita & kegiatan.", fields: "sumber: berita · template: berita.list", status: "Draf", updatedAt: "2026-10-19T10:00:00.000Z" },
  ],
  media: [
    { id: "media-logo", title: "logo-sekolah.svg", slug: "/media/logo-sekolah.svg", description: "Logo resmi lembaga · SVG · 42 KB", fields: "folder: Identitas · checksum tersimpan", status: "Terbit", updatedAt: "2026-10-20T03:00:00.000Z" },
    { id: "media-campus", title: "gedung-sekolah.jpg", slug: "/media/gedung-sekolah.jpg", description: "Foto gedung utama · JPG · 1,8 MB", fields: "folder: Fasilitas · digunakan di Beranda", status: "Terbit", updatedAt: "2026-10-18T02:00:00.000Z" },
  ],
  templates: [
    { id: "template-home", title: "Beranda sekolah", slug: "page.home", description: "Hero, program, prestasi, dan ajakan pendaftaran.", fields: "varian: akademik, modern · slot: 5", status: "Terbit", updatedAt: "2026-10-24T09:00:00.000Z" },
    { id: "template-news", title: "Detail berita", slug: "berita.detail", description: "Tata letak artikel dengan gambar sampul dan metadata.", fields: "varian: default, hero-with-sidebar · binding: 4/4", status: "Terbit", updatedAt: "2026-10-23T08:00:00.000Z" },
    { id: "template-form", title: "Formulir pendaftaran", slug: "form.admission", description: "Form publik untuk penerimaan siswa baru.", fields: "varian: single-column · binding: 3/5", status: "Draf", updatedAt: "2026-10-20T04:00:00.000Z" },
  ],
  navigation: [
    { id: "menu-about", title: "Tentang", slug: "#tentang", description: "Menu utama · anchor halaman.", fields: "urutan: 1 · tampil: ya", status: "Terbit", updatedAt: "2026-10-20T04:00:00.000Z" },
    { id: "menu-program", title: "Pendidikan", slug: "#program", description: "Menu utama · anchor halaman.", fields: "urutan: 2 · tampil: ya", status: "Terbit", updatedAt: "2026-10-20T04:00:00.000Z" },
    { id: "menu-achievements", title: "Prestasi & berita", slug: "#prestasi", description: "Menu utama · anchor halaman.", fields: "urutan: 3 · tampil: ya", status: "Terbit", updatedAt: "2026-10-20T04:00:00.000Z" },
    { id: "menu-contact", title: "Kontak", slug: "#kontak", description: "Menu utama · anchor halaman.", fields: "urutan: 4 · tampil: ya", status: "Terbit", updatedAt: "2026-10-20T04:00:00.000Z" },
  ],
  submissions: [
    { id: "submission-001", title: "Nadia Putri", slug: "PPDB-2026-001", description: "Pendaftar · SMP Negeri 2 Bandung · 24 Okt 2026", fields: "kontak: nadia@example.test · pilihan: IPA", status: "Baru", updatedAt: "2026-10-24T09:00:00.000Z" },
    { id: "submission-002", title: "Rafi Maulana", slug: "PPDB-2026-002", description: "Pendaftar · SMP Cendekia · 23 Okt 2026", fields: "kontak: rafi@example.test · pilihan: IPS", status: "Ditinjau", updatedAt: "2026-10-23T07:00:00.000Z" },
    { id: "submission-003", title: "Alya Safitri", slug: "PPDB-2026-003", description: "Pendaftar · MTs Al-Ikhlas · 22 Okt 2026", fields: "kontak: alya@example.test · pilihan: IPA", status: "Diterima", updatedAt: "2026-10-22T05:00:00.000Z" },
  ],
  users: [
    { id: "user-admin", title: "Admin Sekolah", slug: "admin@cendekia.sch.id", description: "Pengelola website dan pengaturan lembaga.", fields: "role: admin · aktif", status: "Terbit", updatedAt: "2026-10-22T05:00:00.000Z" },
    { id: "user-editor", title: "Editor Konten", slug: "editor@cendekia.sch.id", description: "Mengelola dan menerbitkan konten.", fields: "role: editor · aktif", status: "Terbit", updatedAt: "2026-10-21T05:00:00.000Z" },
    { id: "user-contributor", title: "Kontributor", slug: "kontributor@cendekia.sch.id", description: "Membuat draf konten untuk ditinjau.", fields: "role: kontributor · aktif", status: "Draf", updatedAt: "2026-10-20T05:00:00.000Z" },
  ],
}

export function createInitialData(): CmsData {
  return {
    records: initialRecords,
    identity: {
      name: "SMA Cendekia Nusantara",
      shortName: "SMA Cendekia",
      level: "SMA · Swasta",
      accreditation: "A",
      address: "Jl. Pendidikan No. 25, Bandung, Jawa Barat",
      phone: "(022) 7000 1234",
      email: "info@cendekia.sch.id",
      vision: "Menjadi komunitas belajar yang unggul, berkarakter, dan siap menghadapi masa depan.",
    },
    settings: {
      siteTitle: "SMA Cendekia Nusantara | Profil Sekolah",
      description: "Profil, program pendidikan, prestasi, dan informasi penerimaan siswa baru.",
      admissionStatus: "Dibuka · 2026/2027",
      admissionEnabled: true,
    },
    templateConfigs: [],
    audit: [],
  }
}
