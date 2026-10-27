"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  AlertCircle,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  Globe,
  ImageIcon,
  Mail,
  MapPin,
  Phone,
  Plus,
  RotateCcw,
  Save,
  School,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { fetchIdentityData, updateIdentity } from "@/lib/identity/client/api"
import {
  institutionLevelLabel,
  institutionLevels,
  institutionStatusLabel,
  institutionStatuses,
  socialMediaPlatforms,
} from "@/lib/identity/constants"
import type {
  IdentityData,
  IdentityMediaOption,
  IdentityOperationalHour,
  IdentitySocialMedia,
} from "@/types/type-identity"

type TextFieldProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  required?: boolean
  hint?: string
  disabled?: boolean
  className?: string
  autoComplete?: string
}

function TextField({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  hint,
  disabled,
  className,
  autoComplete,
}: TextFieldProps) {
  return (
    <Field className={className}>
      <FieldLabel htmlFor={id}>
        {label}
        {required && <span className="text-rose-600">*</span>}
      </FieldLabel>
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint && <FieldDescription className="text-xs">{hint}</FieldDescription>}
    </Field>
  )
}

function TextareaField({
  id,
  label,
  value,
  onChange,
  rows = 4,
  placeholder,
  hint,
  disabled,
  required,
  className,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  rows?: number
  placeholder?: string
  hint?: string
  disabled?: boolean
  required?: boolean
  className?: string
}) {
  return (
    <Field className={className}>
      <FieldLabel htmlFor={id}>
        {label}
        {required && <span className="text-rose-600">*</span>}
      </FieldLabel>
      <Textarea
        id={id}
        rows={rows}
        value={value}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint && <FieldDescription className="text-xs">{hint}</FieldDescription>}
    </Field>
  )
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled,
  hint,
  className,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder: string
  disabled?: boolean
  hint?: string
  className?: string
}) {
  return (
    <Field className={className}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <NativeSelect
        id={id}
        value={value}
        disabled={disabled}
        className="w-full"
        onChange={(event) => onChange(event.target.value)}
      >
        <NativeSelectOption value="">{placeholder}</NativeSelectOption>
        {options.map((option) => (
          <NativeSelectOption key={option.value} value={option.value}>
            {option.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      {hint && <FieldDescription className="text-xs">{hint}</FieldDescription>}
    </Field>
  )
}

function sectionIcon(icon: React.ReactNode) {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
      {icon}
    </span>
  )
}

function formatUpdatedAt(value: string) {
  if (!value) return "Belum pernah disimpan"
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value))
}

export function IdentityManager({
  initialIdentity,
  initialMedia,
}: {
  initialIdentity: IdentityData
  initialMedia: IdentityMediaOption[]
}) {
  const [identity, setIdentity] = useState(initialIdentity)
  const [media, setMedia] = useState(initialMedia)
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(initialIdentity))
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")

  const dirty = useMemo(() => JSON.stringify(identity) !== savedSnapshot, [identity, savedSnapshot])

  const completion = useMemo(() => {
    const checks = [
      identity.name,
      identity.shortName,
      identity.level,
      identity.institutionStatus,
      identity.npsn,
      identity.nss,
      identity.accreditation,
      identity.foundedYear,
      identity.slogan,
      identity.headmaster,
      identity.vision,
      identity.mission,
      identity.history,
      identity.address,
      identity.city,
      identity.province,
      identity.phone,
      identity.email,
      identity.website,
      identity.logoMediaId,
    ]
    return Math.round((checks.filter((value) => value.trim().length > 0).length / checks.length) * 100)
  }, [identity])

  const selectedLogo = media.find((item) => item.id === identity.logoMediaId)
  const selectedFavicon = media.find((item) => item.id === identity.faviconMediaId)
  const selectedHero = media.find((item) => item.id === identity.heroMediaId)
  const initials = (identity.shortName || identity.name || "Lembaga")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
  const addressLine = [
    identity.address,
    identity.village,
    identity.district,
    identity.city,
    identity.province,
    identity.postalCode,
  ].filter(Boolean).join(", ")
  const mapHref = identity.latitude && identity.longitude
    ? `https://www.google.com/maps?q=${encodeURIComponent(`${identity.latitude},${identity.longitude}`)}`
    : ""

  function applyIdentity(updater: (current: IdentityData) => IdentityData) {
    setIdentity(updater)
    setNotice("")
    setError("")
  }

  function updateField<K extends keyof IdentityData>(key: K, value: IdentityData[K]) {
    applyIdentity((current) => ({ ...current, [key]: value }))
  }

  function updateSocialMedia(key: keyof IdentitySocialMedia, value: string) {
    applyIdentity((current) => ({
      ...current,
      socialMedia: { ...current.socialMedia, [key]: value },
    }))
  }

  function addOperationalHour() {
    applyIdentity((current) => ({
      ...current,
      operationalHours: [
        ...current.operationalHours,
        { day: "", open: "07:00", close: "15:00" },
      ],
    }))
  }

  function updateOperationalHour(index: number, patch: Partial<IdentityOperationalHour>) {
    applyIdentity((current) => ({
      ...current,
      operationalHours: current.operationalHours.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, ...patch } : entry,
      ),
    }))
  }

  function removeOperationalHour(index: number) {
    applyIdentity((current) => ({
      ...current,
      operationalHours: current.operationalHours.filter((_, entryIndex) => entryIndex !== index),
    }))
  }

  async function handleSave() {
    if (saving || !identity.name.trim()) {
      if (!identity.name.trim()) setError("Nama lembaga wajib diisi sebelum menyimpan.")
      return
    }

    setSaving(true)
    setError("")
    setNotice("")
    try {
      const saved = await updateIdentity(identity)
      setIdentity(saved)
      setSavedSnapshot(JSON.stringify(saved))
      setNotice("Identitas lembaga berhasil disimpan ke database.")
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Identitas lembaga tidak dapat disimpan.")
    } finally {
      setSaving(false)
    }
  }

  async function handleReload() {
    if (dirty && !window.confirm("Muat ulang akan membuang perubahan yang belum disimpan. Lanjutkan?")) {
      return
    }

    setLoading(true)
    setError("")
    setNotice("")
    try {
      const result = await fetchIdentityData()
      setIdentity(result.identity)
      setMedia(result.media)
      setSavedSnapshot(JSON.stringify(result.identity))
      setNotice("Data terbaru berhasil dimuat dari database.")
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Identitas lembaga gagal dimuat.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-8 sm:py-7 lg:px-10">
        <header className="flex flex-col justify-between gap-4 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-end">
          <div className="flex items-start gap-3">
            <span className="mt-1 flex size-11 shrink-0 items-center justify-center rounded-xl bg-violet-700 text-white shadow-sm">
              <School className="size-5" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-700">
                  Pengaturan lembaga
                </p>
                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                  <ShieldCheck className="size-3" /> Data statis
                </Badge>
              </div>
              <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[28px]">
                Identitas lembaga
              </h1>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">
                Satu sumber data untuk profil sekolah di website publik. Perubahan di sini langsung
                memperbarui header, footer, halaman kontak, dan metadata situs.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
            <Button
              variant="outline"
              nativeButton={false}
              render={
                <Link href="/" target="_blank" rel="noreferrer">
                  <Globe /> Lihat website
                </Link>
              }
            />
            <Button type="button" onClick={() => void handleSave()} disabled={saving || !dirty}>
              <Save /> {saving ? "Menyimpan..." : "Simpan perubahan"}
            </Button>
          </div>
        </header>

        {(error || notice) && (
          <div
            role={error ? "alert" : "status"}
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
              error
                ? "border-rose-200 bg-rose-50 text-rose-800"
                : "border-emerald-200 bg-emerald-50 text-emerald-800"
            }`}
          >
            {error ? <AlertCircle className="mt-0.5 size-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 size-4 shrink-0" />}
            <span>{error || notice}</span>
          </div>
        )}

        <form
          id="identity-form"
          onSubmit={(event) => {
            event.preventDefault()
            void handleSave()
          }}
        >
          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0 space-y-5">
              <Card>
                <CardHeader>
                  <div className="flex items-start gap-3">
                    {sectionIcon(<Building2 className="size-4" />)}
                    <div>
                      <CardTitle>Identitas inti</CardTitle>
                      <CardDescription>
                        Nama resmi, jenjang, dan data legal yang digunakan di seluruh halaman.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <TextField
                    id="identity-name"
                    label="Nama lembaga"
                    value={identity.name}
                    onChange={(value) => updateField("name", value)}
                    placeholder="Contoh: SMA Negeri 1 Bandung"
                    required
                    disabled={saving}
                  />
                  <TextField
                    id="identity-short-name"
                    label="Nama singkat"
                    value={identity.shortName}
                    onChange={(value) => updateField("shortName", value)}
                    placeholder="Contoh: SMAN 1 Bandung"
                    hint="Dipakai pada header, footer, dan label ringkas."
                    disabled={saving}
                  />
                  <SelectField
                    id="identity-level"
                    label="Jenjang"
                    value={identity.level}
                    onChange={(value) => updateField("level", value)}
                    options={institutionLevels.map((level) => ({
                      value: level,
                      label: institutionLevelLabel(level),
                    }))}
                    placeholder="Pilih jenjang"
                    disabled={saving}
                  />
                  <SelectField
                    id="identity-status"
                    label="Status lembaga"
                    value={identity.institutionStatus}
                    onChange={(value) => updateField("institutionStatus", value)}
                    options={institutionStatuses.map((status) => ({
                      value: status,
                      label: institutionStatusLabel(status),
                    }))}
                    placeholder="Pilih status"
                    disabled={saving}
                  />
                  <TextField
                    id="identity-npsn"
                    label="NPSN"
                    value={identity.npsn}
                    onChange={(value) => updateField("npsn", value)}
                    placeholder="8 digit NPSN"
                    disabled={saving}
                  />
                  <TextField
                    id="identity-nss"
                    label="NSS"
                    value={identity.nss}
                    onChange={(value) => updateField("nss", value)}
                    placeholder="Nomor statistik sekolah"
                    disabled={saving}
                  />
                  <TextField
                    id="identity-accreditation"
                    label="Akreditasi"
                    value={identity.accreditation}
                    onChange={(value) => updateField("accreditation", value)}
                    placeholder="Contoh: A"
                    disabled={saving}
                  />
                  <TextField
                    id="identity-founded-year"
                    label="Tahun berdiri"
                    value={identity.foundedYear}
                    onChange={(value) => updateField("foundedYear", value)}
                    placeholder="Contoh: 1998"
                    type="number"
                    hint="Rentang yang diterima: 1800–2200."
                    disabled={saving}
                  />
                  <TextField
                    id="identity-headmaster"
                    label="Kepala lembaga"
                    value={identity.headmaster}
                    onChange={(value) => updateField("headmaster", value)}
                    placeholder="Nama kepala sekolah"
                    disabled={saving}
                  />
                  <TextField
                    id="identity-slogan"
                    label="Slogan"
                    value={identity.slogan}
                    onChange={(value) => updateField("slogan", value)}
                    placeholder="Contoh: Berprestasi, berkarakter, berbudaya"
                    disabled={saving}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-start gap-3">
                    {sectionIcon(<Phone className="size-4" />)}
                    <div>
                      <CardTitle>Kontak resmi</CardTitle>
                      <CardDescription>
                        Kanal komunikasi yang tampil di website dan halaman kontak.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <TextField
                    id="identity-phone"
                    label="Telepon"
                    value={identity.phone}
                    onChange={(value) => updateField("phone", value)}
                    placeholder="(022) 1234567"
                    type="tel"
                    disabled={saving}
                  />
                  <TextField
                    id="identity-whatsapp"
                    label="WhatsApp"
                    value={identity.whatsapp}
                    onChange={(value) => updateField("whatsapp", value)}
                    placeholder="0812 3456 7890"
                    type="tel"
                    disabled={saving}
                  />
                  <TextField
                    id="identity-email"
                    label="Email"
                    value={identity.email}
                    onChange={(value) => updateField("email", value)}
                    placeholder="info@sekolah.sch.id"
                    type="email"
                    disabled={saving}
                  />
                  <TextField
                    id="identity-website"
                    label="Website"
                    value={identity.website}
                    onChange={(value) => updateField("website", value)}
                    placeholder="https://sekolah.sch.id"
                    type="url"
                    disabled={saving}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {sectionIcon(<MapPin className="size-4" />)}
                      <div>
                        <CardTitle>Alamat &amp; lokasi</CardTitle>
                        <CardDescription>
                          Alamat lengkap dan koordinat untuk peta serta data terstruktur.
                        </CardDescription>
                      </div>
                    </div>
                    {mapHref && (
                      <Button
                        variant="outline"
                        size="sm"
                        nativeButton={false}
                        render={
                          <Link href={mapHref} target="_blank" rel="noreferrer">
                            <ExternalLink /> Peta
                          </Link>
                        }
                      />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <TextareaField
                    id="identity-address"
                    label="Alamat jalan"
                    value={identity.address}
                    onChange={(value) => updateField("address", value)}
                    placeholder="Jl. Pendidikan No. 1"
                    rows={2}
                    className="md:col-span-2"
                    disabled={saving}
                  />
                  <TextField
                    id="identity-village"
                    label="Kelurahan / desa"
                    value={identity.village}
                    onChange={(value) => updateField("village", value)}
                    disabled={saving}
                  />
                  <TextField
                    id="identity-district"
                    label="Kecamatan"
                    value={identity.district}
                    onChange={(value) => updateField("district", value)}
                    disabled={saving}
                  />
                  <TextField
                    id="identity-city"
                    label="Kota / kabupaten"
                    value={identity.city}
                    onChange={(value) => updateField("city", value)}
                    disabled={saving}
                  />
                  <TextField
                    id="identity-province"
                    label="Provinsi"
                    value={identity.province}
                    onChange={(value) => updateField("province", value)}
                    disabled={saving}
                  />
                  <TextField
                    id="identity-postal-code"
                    label="Kode pos"
                    value={identity.postalCode}
                    onChange={(value) => updateField("postalCode", value)}
                    placeholder="40123"
                    disabled={saving}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField
                      id="identity-latitude"
                      label="Latitude"
                      value={identity.latitude}
                      onChange={(value) => updateField("latitude", value)}
                      placeholder="-6.914744"
                      disabled={saving}
                    />
                    <TextField
                      id="identity-longitude"
                      label="Longitude"
                      value={identity.longitude}
                      onChange={(value) => updateField("longitude", value)}
                      placeholder="107.609810"
                      disabled={saving}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-start gap-3">
                    {sectionIcon(<Sparkles className="size-4" />)}
                    <div>
                      <CardTitle>Profil publik</CardTitle>
                      <CardDescription>
                        Visi, misi, dan sejarah yang ditampilkan pada halaman tentang sekolah.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <TextareaField
                    id="identity-vision"
                    label="Visi"
                    value={identity.vision}
                    onChange={(value) => updateField("vision", value)}
                    placeholder="Menjadi lembaga pendidikan unggul dan berkarakter."
                    rows={3}
                    disabled={saving}
                  />
                  <TextareaField
                    id="identity-mission"
                    label="Misi"
                    value={identity.mission}
                    onChange={(value) => updateField("mission", value)}
                    placeholder="Tulis satu poin misi per baris."
                    hint="Setiap baris akan disimpan sebagai satu poin misi."
                    rows={5}
                    disabled={saving}
                  />
                  <TextareaField
                    id="identity-history"
                    label="Sejarah singkat"
                    value={identity.history}
                    onChange={(value) => updateField("history", value)}
                    placeholder="Ceritakan latar belakang dan perjalanan lembaga."
                    rows={4}
                    disabled={saving}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-start gap-3">
                    {sectionIcon(<ImageIcon className="size-4" />)}
                    <div>
                      <CardTitle>Media identitas</CardTitle>
                      <CardDescription>
                        Pilih gambar dari pustaka media untuk logo, favicon, dan hero website.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  {[
                    {
                      id: "identity-logo",
                      label: "Logo",
                      value: identity.logoMediaId,
                      onChange: (value: string) => updateField("logoMediaId", value),
                      selected: selectedLogo,
                      shape: "rounded-lg",
                    },
                    {
                      id: "identity-favicon",
                      label: "Favicon",
                      value: identity.faviconMediaId,
                      onChange: (value: string) => updateField("faviconMediaId", value),
                      selected: selectedFavicon,
                      shape: "rounded-full",
                    },
                    {
                      id: "identity-hero",
                      label: "Hero",
                      value: identity.heroMediaId,
                      onChange: (value: string) => updateField("heroMediaId", value),
                      selected: selectedHero,
                      shape: "rounded-lg",
                    },
                  ].map((item) => (
                    <div key={item.id} className="space-y-3 rounded-xl border border-slate-200 p-3">
                      <div className="flex items-center gap-3">
                        {item.selected ? (
                          <Image
                            src={item.selected.publicUrl}
                            alt=""
                            width={48}
                            height={48}
                            unoptimized
                            className={`size-12 shrink-0 object-cover ${item.shape}`}
                          />
                        ) : (
                          <span className={`flex size-12 shrink-0 items-center justify-center bg-slate-100 text-slate-400 ${item.shape}`}>
                            <ImageIcon className="size-5" />
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800">{item.label}</p>
                          <p className="truncate text-[11px] text-slate-500">
                            {item.selected?.title || "Belum dipilih"}
                          </p>
                        </div>
                      </div>
                      <SelectField
                        id={item.id}
                        label={`Pilih ${item.label.toLocaleLowerCase("id")}`}
                        value={item.value}
                        onChange={item.onChange}
                        options={media.map((option) => ({
                          value: option.id,
                          label: option.title,
                        }))}
                        placeholder="Tidak dipilih"
                        disabled={saving}
                      />
                    </div>
                  ))}
                  {!media.length && (
                    <p className="text-xs text-slate-500 md:col-span-3">
                      Belum ada gambar di pustaka media. Unggah gambar terlebih dahulu melalui modul Media.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-start gap-3">
                    {sectionIcon(<Globe className="size-4" />)}
                    <div>
                      <CardTitle>Sosial media</CardTitle>
                      <CardDescription>
                        Akun resmi lembaga. Isi nama pengguna atau tautan lengkap.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  {socialMediaPlatforms.map((platform) => (
                    <TextField
                      key={platform.key}
                      id={`identity-social-${platform.key}`}
                      label={platform.label}
                      value={identity.socialMedia[platform.key]}
                      onChange={(value) => updateSocialMedia(platform.key, value)}
                      placeholder={platform.placeholder}
                      disabled={saving}
                    />
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {sectionIcon(<Clock className="size-4" />)}
                      <div>
                        <CardTitle>Jam operasional</CardTitle>
                        <CardDescription>
                          Jadwal layanan yang dapat ditampilkan di halaman kontak.
                        </CardDescription>
                      </div>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addOperationalHour} disabled={saving}>
                      <Plus /> Tambah
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {identity.operationalHours.length ? (
                    identity.operationalHours.map((entry, index) => (
                      <div
                        key={`${entry.day}-${index}`}
                        className="grid gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1fr_130px_130px_auto] sm:items-end"
                      >
                        <TextField
                          id={`identity-hours-day-${index}`}
                          label="Hari"
                          value={entry.day}
                          onChange={(value) => updateOperationalHour(index, { day: value })}
                          placeholder="Senin–Jumat"
                          disabled={saving}
                        />
                        <TextField
                          id={`identity-hours-open-${index}`}
                          label="Buka"
                          value={entry.open}
                          onChange={(value) => updateOperationalHour(index, { open: value })}
                          type="time"
                          disabled={saving}
                        />
                        <TextField
                          id={`identity-hours-close-${index}`}
                          label="Tutup"
                          value={entry.close}
                          onChange={(value) => updateOperationalHour(index, { close: value })}
                          type="time"
                          disabled={saving}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="Hapus jam operasional"
                          className="text-slate-500 hover:bg-rose-50 hover:text-rose-700"
                          onClick={() => removeOperationalHour(index)}
                          disabled={saving}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center">
                      <Clock className="mx-auto size-5 text-slate-400" />
                      <p className="mt-2 text-sm font-medium text-slate-700">Belum ada jam operasional</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Tambahkan jadwal agar masyarakat tahu kapan layanan dibuka.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-xs text-slate-500">
                  {dirty ? "Ada perubahan yang belum disimpan." : "Semua perubahan sudah tersimpan."}
                </p>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" onClick={() => void handleReload()} disabled={loading || saving}>
                    <RotateCcw /> {loading ? "Memuat..." : "Muat ulang"}
                  </Button>
                  <Button type="submit" disabled={saving || !dirty}>
                    <Save /> {saving ? "Menyimpan..." : "Simpan"}
                  </Button>
                </div>
              </div>
            </div>

            <aside className="space-y-5 xl:sticky xl:top-20">
              <Card>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    {selectedLogo ? (
                      <Image
                        src={selectedLogo.publicUrl}
                        alt=""
                        width={56}
                        height={56}
                        unoptimized
                        className="size-14 shrink-0 rounded-xl object-cover ring-1 ring-slate-200"
                      />
                    ) : (
                      <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-violet-700 text-lg font-semibold text-white">
                        {initials || "L"}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {identity.name || "Nama lembaga"}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {identity.slogan || "Slogan lembaga"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {identity.level && <Badge variant="secondary">{institutionLevelLabel(identity.level)}</Badge>}
                    {identity.institutionStatus && (
                      <Badge variant="outline" className="border-violet-200 bg-violet-50 text-violet-700">
                        {institutionStatusLabel(identity.institutionStatus)}
                      </Badge>
                    )}
                    {identity.accreditation && (
                      <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                        <BadgeCheck className="size-3" /> Akreditasi {identity.accreditation}
                      </Badge>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-2.5 text-xs text-slate-600">
                    <p className="flex items-start gap-2">
                      <MapPin className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
                      <span>{addressLine || "Alamat belum diisi"}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="size-3.5 shrink-0 text-slate-400" />
                      <span>{identity.phone || identity.whatsapp || "Telepon belum diisi"}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail className="size-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">{identity.email || "Email belum diisi"}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <UserRound className="size-3.5 shrink-0 text-slate-400" />
                      <span>{identity.headmaster || "Kepala lembaga belum diisi"}</span>
                    </p>
                  </div>

                  {identity.website && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      nativeButton={false}
                      render={
                        <Link href={identity.website} target="_blank" rel="noreferrer">
                          <ExternalLink /> Buka website lembaga
                        </Link>
                      }
                    />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Kelengkapan data</CardTitle>
                  <CardDescription>{completion}% data inti sudah terisi.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Progress value={completion} aria-label="Kelengkapan identitas" />
                  <p className="text-xs leading-relaxed text-slate-500">
                    Semakin lengkap data, semakin siap website sekolah digunakan untuk publikasi dan
                    pencarian.
                  </p>
                  <Separator />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Terakhir diperbarui
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-700">{formatUpdatedAt(identity.updatedAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="submit" className="flex-1" disabled={saving || !dirty}>
                      <Save /> {saving ? "Menyimpan..." : "Simpan"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label="Muat ulang identitas"
                      onClick={() => void handleReload()}
                      disabled={loading || saving}
                    >
                      <RotateCcw />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[11px] leading-relaxed text-amber-900">
                <ShieldCheck className="mt-0.5 size-4 shrink-0" />
                <p>
                  Identitas disimpan sebagai satu baris statis di PostgreSQL dan setiap perubahan dicatat
                  pada audit log.
                </p>
              </div>
            </aside>
          </div>
        </form>
      </div>
    </div>
  )
}
