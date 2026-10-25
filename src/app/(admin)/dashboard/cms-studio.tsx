"use client"

import {
  Activity,
  Archive,
  ArrowUpRight,
  BookOpen,
  Check,
  FileImage,
  FileText,
  FolderKanban,
  LayoutTemplate,
  Menu,
  Newspaper,
  Plus,
  School,
  Search,
  Settings2,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react"
import { MediaUploader } from "./media-uploader"
import type { CmsStatus, TemplateEditorConfig } from "@/lib/cms-data"

type ModuleKey =
  | "overview"
  | "identity"
  | "collections"
  | "items"
  | "pages"
  | "media"
  | "templates"
  | "navigation"
  | "submissions"
  | "users"
  | "settings"
  | "audit"

type RecordKey = Exclude<ModuleKey, "overview" | "identity" | "settings" | "audit">
type Status = CmsStatus

type CmsRecord = {
  id: string
  title: string
  slug: string
  description: string
  fields: string
  status: Status
  updatedAt: string
}

type CmsData = {
  records: Record<RecordKey, CmsRecord[]>
  templateConfigs: TemplateEditorConfig[]
  identity: {
    name: string
    shortName: string
    level: string
    accreditation: string
    address: string
    phone: string
    email: string
    vision: string
  }
  settings: {
    siteTitle: string
    description: string
    admissionStatus: string
    admissionEnabled: boolean
  }
  audit: { id: string; title: string; description: string; updatedAt: string }[]
}

type RecordDraft = Omit<CmsRecord, "id" | "updatedAt">
type TemplateSlotDraft =
  | { source: "field"; key: string }
  | { source: "static"; value: string }
type TemplateConfigDraft = {
  variant: string
  slots: Record<string, TemplateSlotDraft>
}

const modules: {
  key: ModuleKey
  label: string
  description: string
  icon: typeof School
  recordKey?: RecordKey
  noun?: string
  permission?: string
}[] = [
  { key: "overview", label: "Ringkasan", description: "Ikhtisar konten dan aktivitas website.", icon: Activity },
  { key: "identity", label: "Identitas lembaga", description: "Data dasar, alamat, kontak, dan profil lembaga.", icon: School, permission: "identitas.update" },
  { key: "collections", label: "Koleksi & konten", description: "Definisi koleksi, field, dan item konten.", icon: FolderKanban, recordKey: "collections", noun: "koleksi", permission: "collection.fields.manage" },
  { key: "items", label: "Artikel & agenda", description: "Item berita yang tampil di website publik.", icon: Newspaper, recordKey: "items", noun: "artikel", permission: "collection.items.create" },
  { key: "pages", label: "Halaman", description: "Halaman profil, landing page, dan status publikasi.", icon: FileText, recordKey: "pages", noun: "halaman", permission: "pages.manage" },
  { key: "media", label: "Media", description: "Pustaka gambar, dokumen, dan file website.", icon: FileImage, recordKey: "media", noun: "media", permission: "media.upload" },
  { key: "templates", label: "Template & binding", description: "Registry tampilan, varian, dan pemetaan field.", icon: LayoutTemplate, recordKey: "templates", noun: "template", permission: "template.view" },
  { key: "navigation", label: "Navigasi", description: "Susunan menu header dan footer website.", icon: Menu, recordKey: "navigation", noun: "tautan menu", permission: "menu.manage" },
  { key: "submissions", label: "Form PPDB", description: "Data pendaftar dan tahapan peninjauan.", icon: BookOpen, recordKey: "submissions", noun: "pendaftar", permission: "submission.view" },
  { key: "users", label: "Pengguna & role", description: "Kelola akun dan peran akses.", icon: Users, recordKey: "users", noun: "pengguna", permission: "user.manage" },
  { key: "settings", label: "Pengaturan", description: "Preferensi website dan status penerimaan.", icon: Settings2, permission: "settings.manage" },
  { key: "audit", label: "Log aktivitas", description: "Riwayat perubahan administratif.", icon: ShieldCheck, permission: "audit.view" },
]

const initialRecords: CmsData["records"] = {
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

function createInitialData(): CmsData {
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

function subscribeToHash(callback: () => void) {
  window.addEventListener("hashchange", callback)
  return () => window.removeEventListener("hashchange", callback)
}

function getHashSnapshot() {
  return window.location.hash.slice(1)
}

function getServerHashSnapshot() {
  return "overview"
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value))
}

function statusStyle(status: Status) {
  if (status === "Terbit" || status === "Diterima") return "bg-emerald-50 text-emerald-700"
  if (status === "Baru" || status === "Ditinjau") return "bg-amber-50 text-amber-700"
  if (status === "Diarsipkan") return "bg-slate-100 text-slate-500"
  return "bg-violet-50 text-violet-700"
}

function statusOptions(module: ModuleKey): Status[] {
  if (module === "submissions") return ["Baru", "Ditinjau", "Diterima", "Ditolak", "Daftar tunggu", "Diarsipkan"]
  if (module === "users" || module === "collections") return ["Terbit", "Diarsipkan"]
  return ["Draf", "Terbit", "Diarsipkan"]
}

const blankDraft: RecordDraft = {
  title: "",
  slug: "",
  description: "",
  fields: "",
  status: "Draf",
}

function inputClassName() {
  return "mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
}

export function CmsStudio({ permissions }: { permissions: string[] }) {
  const hash = useSyncExternalStore(
    subscribeToHash,
    getHashSnapshot,
    getServerHashSnapshot,
  )
  const [data, setData] = useState<CmsData>(createInitialData)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [writeError, setWriteError] = useState("")
  const [notice, setNotice] = useState("")
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("Semua status")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<RecordDraft>(blankDraft)
  const [userPassword, setUserPassword] = useState("")
  const [templateConfigDraft, setTemplateConfigDraft] = useState<TemplateConfigDraft | null>(null)

  const refreshData = useCallback(async () => {
    const response = await fetch("/api/admin/cms", { cache: "no-store" })
    const result = await response.json() as CmsData & { error?: string }
    if (!response.ok) throw new Error(result.error || "Data CMS gagal dimuat.")
    setData(result)
    setLoadError("")
  }, [])

  useEffect(() => {
    void Promise.resolve()
      .then(refreshData)
      .catch((error: unknown) => {
        setLoadError(error instanceof Error ? error.message : "Data CMS gagal dimuat.")
      })
      .finally(() => setLoading(false))
  }, [refreshData])

  const active = modules.some((module) => module.key === hash)
    ? hash as ModuleKey
    : "overview"

  async function persist(module: ModuleKey, method: "POST" | "PATCH" | "DELETE", body: Record<string, unknown>, successMessage: string) {
    try {
      const response = await fetch("/api/admin/cms", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module, ...body }),
      })
      const result = await response.json() as { error?: string }
      if (!response.ok) throw new Error(result.error || "Perubahan tidak dapat disimpan.")
      await refreshData()
      setWriteError("")
      setNotice(successMessage)
      return true
    } catch (error) {
      setWriteError(error instanceof Error ? error.message : "Perubahan tidak dapat disimpan.")
      return false
    }
  }

  const activeModule = modules.find((module) => module.key === active) ?? modules[0]
  const canAccessModule = !activeModule.permission || permissions.includes(activeModule.permission)
  const canCreateRecord = active === "collections" || active === "items" || active === "pages" || active === "navigation" || active === "users"
  const canManageRecords = active === "identity"
    ? permissions.includes("identitas.update")
    : active === "settings"
      ? permissions.includes("settings.manage")
      : active === "collections"
    ? permissions.includes("collection.fields.manage")
    : active === "items"
      ? permissions.includes("collection.items.create")
      : active === "pages"
        ? permissions.includes("pages.manage")
        : active === "navigation"
          ? permissions.includes("menu.manage")
          : active === "submissions"
            ? permissions.includes("submission.update")
            : active === "users"
              ? permissions.includes("user.manage")
              : active === "media"
                ? permissions.includes("media.upload")
                : active === "templates" && permissions.includes("template.config.manage")
  const canPublishItems = permissions.includes("collection.items.publish")
  const records = useMemo(
    () => activeModule.recordKey ? data.records[activeModule.recordKey] : [],
    [activeModule.recordKey, data.records],
  )
  const visibleRecords = useMemo(() => records.filter((record) => {
    const matchesQuery = `${record.title} ${record.slug} ${record.description} ${record.fields}`
      .toLocaleLowerCase("id")
      .includes(query.toLocaleLowerCase("id"))
    return matchesQuery && (statusFilter === "Semua status" || record.status === statusFilter)
  }), [query, records, statusFilter])

  function openNewRecord() {
    setEditingId("")
    setUserPassword("")
    setTemplateConfigDraft(null)
    setDraft({
      ...blankDraft,
      status: active === "submissions" ? "Baru" : active === "users" || active === "collections" ? "Terbit" : "Draf",
      fields: active === "users" ? "role: kontributor" : active === "items" ? "collection_slug: berita" : "",
    })
  }

  function openEditRecord(record: CmsRecord) {
    setEditingId(record.id)
    const template = active === "templates"
      ? data.templateConfigs.find((config) => config.templateId === record.id)
      : undefined
    setTemplateConfigDraft(template ? {
      variant: template.variant,
      slots: Object.fromEntries(template.slots.map((slot) => {
        const binding = template.bindings[slot.key]
        if (binding?.source === "field") {
          return [slot.key, { source: "field" as const, key: binding.key }]
        }
        if (binding?.source === "static") {
          return [slot.key, {
            source: "static" as const,
            value: typeof binding.value === "string" ? binding.value : JSON.stringify(binding.value ?? ""),
          }]
        }
        const matchingField = template.fields.find((field) => field.key === slot.key)
        return [slot.key, matchingField
          ? { source: "field" as const, key: matchingField.key }
          : { source: "static" as const, value: "" }]
      })),
    } : null)
    setDraft({
      title: record.title,
      slug: record.slug,
      description: record.description,
      fields: record.fields,
      status: record.status,
    })
  }

  function saveRecord(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!activeModule.recordKey || !draft.title.trim()) return
    const isUpdate = Boolean(editingId)
    const payload: Record<string, unknown> = { id: editingId || undefined, record: draft }
    if (active === "users" && userPassword) payload.password = userPassword
    if (active === "templates") {
      if (!templateConfigDraft) {
        setWriteError("Konfigurasi template tidak dapat dimuat. Muat ulang halaman lalu coba lagi.")
        return
      }
      payload.templateConfig = templateConfigDraft
    }
    void persist(active, isUpdate ? "PATCH" : "POST", payload, "Perubahan tersimpan di database.")
      .then((saved) => {
        if (saved) {
          setEditingId(null)
          setUserPassword("")
          setTemplateConfigDraft(null)
        }
      })
  }

  function updateTemplateSlot(slotKey: string, value: TemplateSlotDraft) {
    setTemplateConfigDraft((current) => current
      ? { ...current, slots: { ...current.slots, [slotKey]: value } }
      : current)
  }

  function updateRecordStatus(record: CmsRecord) {
    if (!activeModule.recordKey) return
    const nextStatus: Status = record.status === "Terbit" ? "Draf" : "Terbit"
    const updated = { ...record, status: nextStatus }
    void persist(active, "PATCH", { id: record.id, record: updated }, `Status "${record.title}" diperbarui.`)
  }

  function deleteRecord(record: CmsRecord) {
    if (!activeModule.recordKey || !window.confirm(`Hapus "${record.title}"?`)) return
    void persist(active, "DELETE", { id: record.id }, `"${record.title}" dihapus.`)
  }

  function saveIdentity(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void persist("identity", "PATCH", { identity: data.identity }, "Identitas tersimpan.")
  }

  function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void persist("settings", "PATCH", { settings: data.settings }, "Pengaturan tersimpan.")
  }

  const shownStorageError = loadError || writeError
  const countRecords = (key: RecordKey) => data.records[key].length
  const totalItems = Object.values(data.records).reduce((total, items) => total + items.length, 0)

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-8 sm:py-7 lg:px-10">
        <header className="flex flex-col justify-between gap-4 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-700">Studio CMS</p>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-800">PostgreSQL · tersimpan di server</span>
            </div>
            <h1 id="cms-page-title" className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[28px]">{activeModule.label}</h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">{activeModule.description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
            {activeModule.recordKey && canCreateRecord && canManageRecords && (
              <button type="button" onClick={openNewRecord} className="inline-flex h-10 items-center gap-2 rounded-lg bg-violet-700 px-3.5 text-xs font-semibold text-white shadow-sm transition hover:bg-violet-800">
                <Plus className="size-4" /> Tambah {activeModule.noun}
              </button>
            )}
            <Link href="/" target="_blank" className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
              Lihat website <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </header>

        {(shownStorageError || notice) && (
          <div role={shownStorageError ? "alert" : "status"} className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${shownStorageError ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
            <span>{shownStorageError || notice}</span>
            <button type="button" aria-label="Tutup pemberitahuan" onClick={() => setNotice("")} className="rounded p-0.5 opacity-70 hover:opacity-100"><X className="size-4" /></button>
          </div>
        )}

        <div className="min-w-0">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-12 text-center text-sm text-slate-500">Memuat data dari database...</div>
          ) : loadError ? (
            <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-6 text-sm text-rose-800">
              <span>{loadError}</span>
              <button type="button" onClick={() => { setLoading(true); void refreshData().catch((error: unknown) => setLoadError(error instanceof Error ? error.message : "Data CMS gagal dimuat.")).finally(() => setLoading(false)) }} className="rounded-md border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold hover:bg-rose-100">Coba lagi</button>
            </div>
          ) : !canAccessModule ? (
            <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-12 text-center text-sm text-amber-900">Akun Anda tidak memiliki izin untuk membuka modul ini.</div>
          ) : <>
            <section id={active} aria-labelledby="cms-page-title" className="scroll-mt-24 min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                {active === "overview" && (
                  <div>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {[
                        { label: "Total konten", value: totalItems, detail: "di seluruh modul", icon: FolderKanban },
                        { label: "Halaman terbit", value: data.records.pages.filter((item) => item.status === "Terbit").length, detail: "halaman publik", icon: FileText },
                        { label: "Pendaftar baru", value: data.records.submissions.filter((item) => item.status === "Baru").length, detail: "perlu ditinjau", icon: BookOpen },
                        { label: "Template aktif", value: data.records.templates.filter((item) => item.status === "Terbit").length, detail: "registry tampilan", icon: LayoutTemplate },
                      ].map((item) => {
                        const StatIcon = item.icon
                        return <article key={item.label} className="rounded-xl border border-slate-200 p-4"><span className="flex size-9 items-center justify-center rounded-lg bg-violet-50 text-violet-700"><StatIcon className="size-4" /></span><p className="mt-4 text-xs text-slate-500">{item.label}</p><p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{item.value}</p><p className="mt-1 text-[11px] text-slate-400">{item.detail}</p></article>
                      })}
                    </div>
                    <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                      <div className="rounded-xl border border-slate-200 p-4">
                        <h3 className="text-sm font-semibold text-slate-800">Modul yang tersedia</h3>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {modules.filter((module) => module.recordKey).map((module) => {
                            const ModuleIcon = module.icon
                            return <a key={module.key} href={`#${module.key}`} className="flex items-center gap-2.5 rounded-lg p-2.5 text-xs text-slate-600 transition hover:bg-slate-50"><ModuleIcon className="size-4 text-violet-600" /><span className="flex-1">{module.label}</span><span className="text-slate-400">{module.recordKey ? countRecords(module.recordKey) : 0}</span></a>
                          })}
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200 p-4">
                        <div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-slate-800">Aktivitas terakhir</h3><a href="#audit" className="text-[11px] font-medium text-violet-700 hover:text-violet-900">Semua log</a></div>
                        {data.audit.length ? <div className="mt-3 space-y-3">{data.audit.slice(0, 4).map((entry) => <div key={entry.id} className="flex gap-2.5"><span className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500"><Activity className="size-3" /></span><div className="min-w-0"><p className="text-xs font-medium text-slate-700">{entry.title}</p><p className="mt-0.5 truncate text-[10px] text-slate-500">{entry.description}</p></div></div>)}</div> : <p className="mt-3 text-xs text-slate-500">Aktivitas perubahan akan tampil di sini.</p>}
                      </div>
                    </div>
                  </div>
                )}

                {active === "identity" && (
                  <form onSubmit={saveIdentity} className="grid gap-4 md:grid-cols-2">
                    {([
                      ["name", "Nama lembaga"],
                      ["shortName", "Nama singkat"],
                      ["level", "Jenjang & status"],
                      ["accreditation", "Akreditasi"],
                      ["address", "Alamat"],
                      ["phone", "Telepon"],
                      ["email", "Email"],
                    ] as const).map(([key, label]) => <label key={key} className="text-xs font-medium text-slate-700">{label}<input required={key === "name"} value={data.identity[key]} onChange={(event) => setData((current) => ({ ...current, identity: { ...current.identity, [key]: event.target.value } }))} className={inputClassName()} /></label>)}
                    <label className="text-xs font-medium text-slate-700 md:col-span-2">Visi lembaga<textarea rows={3} value={data.identity.vision} onChange={(event) => setData((current) => ({ ...current, identity: { ...current.identity, vision: event.target.value } }))} className={inputClassName()} /></label>
                    <div className="flex flex-wrap items-center justify-between gap-3 md:col-span-2"><p className="text-[11px] text-slate-400">Identitas disimpan di PostgreSQL dan perubahan dicatat di audit log.</p><button disabled={!canManageRecords} className="inline-flex h-9 items-center gap-2 rounded-lg bg-violet-700 px-4 text-xs font-semibold text-white hover:bg-violet-800 disabled:opacity-50"><Check className="size-4" /> Simpan identitas</button></div>
                  </form>
                )}

                {active === "settings" && (
                  <form onSubmit={saveSettings} className="grid max-w-2xl gap-4">
                    <label className="text-xs font-medium text-slate-700">Judul website<input value={data.settings.siteTitle} onChange={(event) => setData((current) => ({ ...current, settings: { ...current.settings, siteTitle: event.target.value } }))} className={inputClassName()} /></label>
                    <label className="text-xs font-medium text-slate-700">Deskripsi SEO global<textarea rows={3} value={data.settings.description} onChange={(event) => setData((current) => ({ ...current, settings: { ...current.settings, description: event.target.value } }))} className={inputClassName()} /></label>
                    <label className="text-xs font-medium text-slate-700">Status penerimaan<input value={data.settings.admissionStatus} onChange={(event) => setData((current) => ({ ...current, settings: { ...current.settings, admissionStatus: event.target.value } }))} className={inputClassName()} /></label>
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700"><input type="checkbox" checked={data.settings.admissionEnabled} onChange={(event) => setData((current) => ({ ...current, settings: { ...current.settings, admissionEnabled: event.target.checked } }))} className="size-4 accent-violet-700" /> Buka formulir pendaftaran publik</label>
                    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-[11px] text-slate-400">Pengaturan disimpan di PostgreSQL; secret tidak ditampilkan di formulir.</p><button disabled={!canManageRecords} className="inline-flex h-9 items-center gap-2 rounded-lg bg-violet-700 px-4 text-xs font-semibold text-white hover:bg-violet-800 disabled:opacity-50"><Check className="size-4" /> Simpan pengaturan</button></div>
                  </form>
                )}

                {activeModule.recordKey && (
                  <div>
                    {active === "media" && <MediaUploader onUploaded={refreshData} />}
                    {active === "templates" && <div className="mb-4 rounded-lg border border-sky-100 bg-sky-50 px-3 py-2.5 text-xs leading-relaxed text-sky-800">Template yang tampil berasal dari registry kode; binding tersimpan dan diperiksa di database.</div>}
                    {active === "users" && <div className="mb-4 rounded-lg border border-violet-100 bg-violet-50 px-3 py-2.5 text-xs leading-relaxed text-violet-800">Password disimpan sebagai hash scrypt dan izin selalu diperiksa di server.</div>}
                    {active === "submissions" && <div className="mb-4 rounded-lg border border-sky-100 bg-sky-50 px-3 py-2.5 text-xs leading-relaxed text-sky-800">Data pendaftar tersimpan di database dan ditampilkan hanya bagi role berizin.</div>}
                    <div className="mb-4 flex flex-wrap gap-2">
                      <label className="relative min-w-[220px] flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input aria-label={`Cari ${activeModule.noun}`} placeholder={`Cari ${activeModule.noun}...`} value={query} onChange={(event) => setQuery(event.target.value)} className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" /></label>
                      <select aria-label="Filter status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-600 outline-none focus:border-violet-400"><option>Semua status</option>{statusOptions(active).map((status) => <option key={status}>{status}</option>)}</select>
                    </div>

                    {editingId !== null && canManageRecords && (
                      <form onSubmit={saveRecord} className="mb-5 rounded-xl border border-violet-200 bg-violet-50/40 p-4">
                        <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold text-slate-800">{editingId ? `Ubah ${activeModule.noun}` : `Tambah ${activeModule.noun}`}</h3><button type="button" aria-label="Tutup formulir" onClick={() => setEditingId(null)} className="rounded p-1 text-slate-400 hover:bg-white hover:text-slate-700"><X className="size-4" /></button></div>
                        <div className="grid gap-3 md:grid-cols-2">
                          <label className="text-xs font-medium text-slate-700">{active === "templates" ? "Nama registry" : "Nama / judul"}<input required autoFocus value={draft.title} readOnly={active === "templates"} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} className={inputClassName()} /></label>
                          <label className="text-xs font-medium text-slate-700">{active === "submissions" ? "Kode referensi" : active === "users" ? "Email" : active === "templates" ? "Key registry" : "Slug / key"}<input value={draft.slug} readOnly={active === "templates"} onChange={(event) => setDraft((current) => ({ ...current, slug: event.target.value }))} className={inputClassName()} /></label>
                          <label className="text-xs font-medium text-slate-700 md:col-span-2">Deskripsi / ringkasan<textarea rows={2} value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} className={inputClassName()} /></label>
                          {active !== "templates" && <label className="text-xs font-medium text-slate-700 md:col-span-2">{active === "collections" ? "Field koleksi (pisahkan dengan koma; select: kategori:select[Akademik|Prestasi], multiselect: minat:multiselect[Musik|Olahraga]!, wajib: akhiri tipe dengan !)" : active === "items" ? "Metadata (pisahkan dengan titik koma; JSON/media_multiple gunakan JSON, relation/media gunakan UUID)" : "Catatan / metadata"}<input value={draft.fields} onChange={(event) => setDraft((current) => ({ ...current, fields: event.target.value }))} className={inputClassName()} />{active === "items" && <span className="mt-1 block font-normal text-slate-500">Contoh: setelan:{"{\"mode\":\"formal\"}"}; galeri:{"[\"uuid-media-1\",\"uuid-media-2\"]"}; gambar:uuid-media. ID media dapat disalin dari pustaka media.</span>}</label>}
                          {active === "templates" && templateConfigDraft && (() => {
                            const template = data.templateConfigs.find((config) => config.templateId === editingId)
                            if (!template) {
                              return <p role="alert" className="md:col-span-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-800">Konfigurasi default template tidak tersedia.</p>
                            }
                            return (
                              <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white p-4">
                                <div className="grid gap-3 md:grid-cols-2">
                                  <label className="text-xs font-medium text-slate-700">Varian tampilan
                                    <select
                                      value={templateConfigDraft.variant}
                                      onChange={(event) => setTemplateConfigDraft((current) => current ? { ...current, variant: event.target.value } : current)}
                                      className={inputClassName()}
                                    >
                                      {template.availableVariants.map((variant) => <option key={variant} value={variant}>{variant}</option>)}
                                    </select>
                                  </label>
                                  <p className="self-end pb-2 text-xs text-slate-500">
                                    {template.collectionSlug ? `Binding untuk koleksi ${template.collectionSlug}.` : "Template global; gunakan nilai statis untuk slot yang tidak terikat koleksi."}
                                  </p>
                                </div>
                                <div className="mt-4 space-y-3">
                                  {template.slots.map((slot) => {
                                    const binding = templateConfigDraft.slots[slot.key] ?? { source: "static" as const, value: "" }
                                    const savedBindingStatus = template.bindingStatuses[slot.key]
                                    const bindingStatus = savedBindingStatus ?? (slot.required ? "required_empty" : "unmapped")
                                    const bindingStatusClass = bindingStatus === "ok"
                                      ? "text-emerald-700"
                                      : bindingStatus === "required_empty"
                                        ? "text-amber-700"
                                        : bindingStatus === "unmapped"
                                          ? "text-slate-500"
                                          : "text-rose-700"
                                    const bindingStatusLabel: Record<string, string> = {
                                      ok: "Terhubung",
                                      unmapped: "Belum dipetakan (opsional)",
                                      missing_field: "Field tidak ditemukan",
                                      type_mismatch: "Tipe field tidak cocok",
                                      required_empty: "Nilai wajib belum diisi",
                                    }
                                    return (
                                      <div key={slot.key} className="grid gap-2 rounded-lg border border-slate-100 p-3 md:grid-cols-[1fr_1fr_1.5fr] md:items-end">
                                        <div>
                                          <p className="text-xs font-semibold text-slate-800">{slot.key}{slot.required ? " *" : ""}</p>
                                          <p className="mt-1 text-[11px] text-slate-500">Tipe slot: {slot.type}</p>
                                          <p className={`mt-1 text-[11px] font-medium ${bindingStatusClass}`}>{bindingStatusLabel[bindingStatus] ?? bindingStatus}</p>
                                        </div>
                                        <label className="text-[11px] font-medium text-slate-600">Sumber slot
                                          <select
                                            aria-label={`Sumber slot ${slot.key}`}
                                            value={binding.source}
                                            onChange={(event) => updateTemplateSlot(slot.key, event.target.value === "field"
                                              ? { source: "field", key: template.fields[0]?.key ?? "" }
                                              : { source: "static", value: "" })}
                                            className={inputClassName()}
                                          >
                                            <option value="field" disabled={!template.fields.length}>Field koleksi</option>
                                            <option value="static">Nilai statis</option>
                                          </select>
                                        </label>
                                        {binding.source === "field" ? (
                                          <label className="text-[11px] font-medium text-slate-600">Field koleksi
                                            <select
                                              aria-label={`Field untuk slot ${slot.key}`}
                                              value={binding.key}
                                              onChange={(event) => updateTemplateSlot(slot.key, { source: "field", key: event.target.value })}
                                              className={inputClassName()}
                                              disabled={!template.fields.length}
                                            >
                                              <option value="" disabled>Pilih field...</option>
                                              {template.fields.map((field) => <option key={field.key} value={field.key}>{field.label} ({field.type})</option>)}
                                            </select>
                                            {!template.fields.length && <span className="mt-1 block font-normal text-amber-700">Slot ini belum memiliki field koleksi.</span>}
                                          </label>
                                        ) : (
                                          <label className="text-[11px] font-medium text-slate-600">Nilai statis
                                            <input
                                              aria-label={`Nilai statis slot ${slot.key}`}
                                              value={binding.value}
                                              onChange={(event) => updateTemplateSlot(slot.key, { source: "static", value: event.target.value })}
                                              className={inputClassName()}
                                            />
                                          </label>
                                        )}
                                      </div>
                                    )
                                  })}
                                  {!template.slots.length && <p className="text-xs text-slate-500">Template ini belum mendefinisikan slot.</p>}
                                </div>
                              </div>
                            )
                          })()}
                          {active === "users" && <label className="text-xs font-medium text-slate-700">{editingId ? "Reset password (opsional)" : "Password awal"}<input required={!editingId} type="password" minLength={12} maxLength={128} value={userPassword} onChange={(event) => setUserPassword(event.target.value)} className={inputClassName()} /><span className="mt-1 block font-normal text-slate-500">Minimal 12 karakter. Reset password akan mengakhiri sesi pengguna tersebut.</span></label>}
                          {active !== "templates" && <label className="text-xs font-medium text-slate-700">Status<select value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as Status }))} className={inputClassName()}>{statusOptions(active).map((status) => <option key={status}>{status}</option>)}</select></label>}
                        </div>
                        <div className="mt-4 flex justify-end gap-2"><button type="button" onClick={() => setEditingId(null)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 hover:bg-slate-50">Batal</button><button className="inline-flex h-9 items-center gap-2 rounded-lg bg-violet-700 px-3 text-xs font-semibold text-white hover:bg-violet-800"><Check className="size-4" /> Simpan</button></div>
                      </form>
                    )}

                    <div className="space-y-3 xl:hidden">
                      {visibleRecords.map((record) => (
                        <article key={record.id} className="rounded-xl border border-slate-200 bg-white p-4">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h3 className="text-sm font-semibold leading-5 text-slate-800">{record.title}</h3>
                              <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{record.description}</p>
                            </div>
                            <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${statusStyle(record.status)}`}>{record.status}</span>
                          </div>
                          <dl className="mt-3 space-y-2 border-t border-slate-100 pt-3 text-[11px]">
                            <div className="flex gap-2">
                              <dt className="w-16 shrink-0 text-slate-400">{active === "submissions" ? "Referensi" : active === "users" ? "Email" : "Slug"}</dt>
                              <dd className="min-w-0 break-all font-mono text-slate-600">{record.slug || "—"}</dd>
                            </div>
                            {record.fields && (
                              <div className="flex gap-2">
                                <dt className="w-16 shrink-0 text-slate-400">Detail</dt>
                                <dd className="min-w-0 break-words text-slate-500">{record.fields}</dd>
                              </div>
                            )}
                            <div className="flex gap-2">
                              <dt className="w-16 shrink-0 text-slate-400">Diperbarui</dt>
                              <dd className="text-slate-500">{formatDate(record.updatedAt)}</dd>
                            </div>
                          </dl>
                          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                            {canManageRecords && <button type="button" onClick={() => openEditRecord(record)} className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-50">Ubah</button>}
                            {canManageRecords && active !== "submissions" && active !== "users" && active !== "media" && active !== "templates" && (active !== "items" || canPublishItems) && (
                              <button type="button" onClick={() => updateRecordStatus(record)} className="rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100">
                                {record.status === "Terbit" ? "Jadikan draf" : "Terbitkan"}
                              </button>
                            )}
                            {canManageRecords && ["collections", "items", "pages", "navigation", "users", "media"].includes(active) && <button type="button" aria-label={`Hapus ${record.title}`} onClick={() => deleteRecord(record)} className="ml-auto rounded-md p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-700"><Trash2 className="size-4" /></button>}
                          </div>
                        </article>
                      ))}
                      {!visibleRecords.length && <p className="rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center text-xs text-slate-500">Tidak ada data yang sesuai dengan pencarian.</p>}
                    </div>
                    <div className="hidden overflow-x-auto rounded-xl border border-slate-200 xl:block">
                      <table className="w-full min-w-[700px] table-fixed border-collapse text-left">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="w-[28%] px-4 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Nama</th>
                            <th className="w-[24%] px-4 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Slug / detail</th>
                            <th className="w-[9%] px-3 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Status</th>
                            <th className="w-[17%] px-3 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Diperbarui</th>
                            <th className="w-[22%] px-3 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {visibleRecords.map((record) => (
                            <tr key={record.id} className="align-top hover:bg-slate-50/70">
                              <td className="px-4 py-3"><p className="text-xs font-semibold text-slate-800">{record.title}</p><p className="mt-1 max-w-sm text-[11px] leading-relaxed text-slate-500">{record.description}</p></td>
                              <td className="px-4 py-3"><p className="font-mono text-[10px] text-slate-600">{record.slug || "—"}</p><p className="mt-1 max-w-xs text-[10px] leading-relaxed text-slate-400">{record.fields || "—"}</p></td>
                              <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${statusStyle(record.status)}`}>{record.status}</span></td>
                              <td className="whitespace-nowrap px-4 py-3 text-[10px] text-slate-500">{formatDate(record.updatedAt)}</td>
                              <td className="px-4 py-3"><div className="flex flex-nowrap items-center gap-1 whitespace-nowrap">{canManageRecords && <button type="button" onClick={() => openEditRecord(record)} className="whitespace-nowrap rounded-md px-2 py-1.5 text-[10px] font-semibold text-violet-700 hover:bg-violet-50">Ubah</button>}{canManageRecords && active !== "submissions" && active !== "users" && active !== "media" && active !== "templates" && (active !== "items" || canPublishItems) && <button type="button" onClick={() => updateRecordStatus(record)} className="whitespace-nowrap rounded-md px-2 py-1.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-100">{record.status === "Terbit" ? "Jadikan draf" : "Terbitkan"}</button>}{canManageRecords && ["collections", "items", "pages", "navigation", "users", "media"].includes(active) && <button type="button" aria-label={`Hapus ${record.title}`} onClick={() => deleteRecord(record)} className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-700"><Trash2 className="size-3.5" /></button>}</div></td>
                            </tr>
                          ))}
                          {!visibleRecords.length && <tr><td colSpan={5} className="px-4 py-10 text-center text-xs text-slate-500">Tidak ada data yang sesuai dengan pencarian.</td></tr>}
                        </tbody>
                      </table>
                    </div>
                    <p className="mt-3 text-[10px] text-slate-400">Menampilkan {visibleRecords.length} dari {records.length} {activeModule.noun} · PostgreSQL</p>
                  </div>
                )}

                {active === "audit" && (
                  <div className="space-y-3">
                    {data.audit.length ? data.audit.map((entry) => <article key={entry.id} className="flex gap-3 rounded-xl border border-slate-100 p-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500"><Activity className="size-4" /></span><div className="min-w-0 flex-1"><p className="text-xs font-semibold text-slate-800">{entry.title}</p><p className="mt-1 text-xs text-slate-500">{entry.description}</p></div><time className="shrink-0 text-[10px] text-slate-400">{formatDate(entry.updatedAt)}</time></article>) : <div className="rounded-xl border border-dashed border-slate-200 px-4 py-12 text-center"><Activity className="mx-auto size-6 text-slate-300" /><p className="mt-3 text-sm font-medium text-slate-700">Belum ada aktivitas</p><p className="mt-1 text-xs text-slate-500">Aktivitas administratif akan dicatat di sini.</p></div>}
                  </div>
                )}
            </section>
            <footer className="mt-4 flex flex-wrap items-start gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[11px] leading-relaxed text-slate-500">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-amber-600" />
              <p>Operasi CMS memakai PostgreSQL, sesi HttpOnly, dan pemeriksaan izin di server. File tersimpan lokal selama pengembangan; produksi perlu storage eksternal, HTTPS, dan backup.</p>
            </footer>
            <div className="mt-3 flex justify-end px-1">
              <button type="button" onClick={() => { setLoading(true); void refreshData().catch((error: unknown) => setLoadError(error instanceof Error ? error.message : "Data CMS gagal dimuat.")).finally(() => setLoading(false)) }} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-500 transition hover:bg-slate-100">
                <Archive className="size-3.5" /> Muat ulang dari database
              </button>
            </div>
          </>}
          </div>
      </div>
    </div>
  )
}
