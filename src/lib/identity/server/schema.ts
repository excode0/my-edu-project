import { z } from "zod"
import { institutionLevels, institutionStatuses } from "@/lib/identity/constants"

const optionalText = (max: number) => z.string().trim().max(max)
const optionalEmail = z.string().trim().email("Format email tidak valid.").max(180).or(z.literal(""))
const optionalUuid = z.string().uuid("Media yang dipilih tidak valid.").or(z.literal(""))

const yearSchema = z.string().trim().refine(
  (value) => value === "" || (/^\d{4}$/.test(value) && Number(value) >= 1800 && Number(value) <= 2200),
  "Tahun berdiri harus berada di antara 1800 dan 2200.",
)

const coordinateSchema = (min: number, max: number, label: string) => z.string().trim().refine(
  (value) => value === "" || (Number.isFinite(Number(value)) && Number(value) >= min && Number(value) <= max),
  `${label} harus berupa angka antara ${min} dan ${max}.`,
)

export const identitySchema = z.object({
  name: z.string().trim().min(1, "Nama lembaga wajib diisi.").max(200),
  shortName: optionalText(60),
  level: z.enum(institutionLevels).or(z.literal("")),
  institutionStatus: z.enum(institutionStatuses).or(z.literal("")),
  npsn: optionalText(20),
  nss: optionalText(20),
  accreditation: optionalText(10),
  foundedYear: yearSchema,
  slogan: optionalText(255),
  headmaster: optionalText(120),
  vision: z.string().max(10_000),
  mission: z.string().max(20_000),
  history: z.string().max(20_000),
  address: z.string().max(2_000),
  village: optionalText(120),
  district: optionalText(120),
  city: optionalText(120),
  province: optionalText(120),
  postalCode: optionalText(10),
  latitude: coordinateSchema(-90, 90, "Latitude"),
  longitude: coordinateSchema(-180, 180, "Longitude"),
  phone: optionalText(30),
  whatsapp: optionalText(30),
  email: optionalEmail,
  website: optionalText(255),
  socialMedia: z.object({
    instagram: optionalText(500),
    facebook: optionalText(500),
    youtube: optionalText(500),
    tiktok: optionalText(500),
    x: optionalText(500),
    linkedin: optionalText(500),
  }),
  operationalHours: z.array(z.object({
    day: optionalText(60),
    open: optionalText(10),
    close: optionalText(10),
  })).max(20),
  logoMediaId: optionalUuid,
  faviconMediaId: optionalUuid,
  heroMediaId: optionalUuid,
})

export type IdentityInput = z.infer<typeof identitySchema>
