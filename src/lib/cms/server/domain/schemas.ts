import { z } from "zod"
import { modules } from "./constants"

export const recordSchema = z.object({
  title: z.string().trim().min(1).max(200),
  slug: z.string().trim().max(500),
  description: z.string().max(20_000),
  fields: z.string().max(4_000),
  itemData: z.record(z.string(), z.unknown()).optional()
    .refine((value) => value === undefined || JSON.stringify(value).length <= 100_000, "Data field terlalu besar."),
  status: z.string().max(40),
})

export const mutationSchema = z.object({
  module: z.enum(modules),
  id: z.string().uuid().optional(),
  record: recordSchema.optional(),
  identity: z.object({
    name: z.string().trim().min(1).max(200),
    shortName: z.string().trim().max(60),
    level: z.string().max(80),
    accreditation: z.string().trim().max(10),
    address: z.string().max(2_000),
    phone: z.string().trim().max(30),
    email: z.string().trim().email().max(180).or(z.literal("")),
    vision: z.string().max(10_000),
    slogan: z.string().trim().max(255).or(z.literal("")),
    npsn: z.string().trim().max(20).or(z.literal("")),
    nss: z.string().trim().max(20).or(z.literal("")),
    tahunBerdiri: z.string().trim().max(10).or(z.literal("")),
    sejarahSingkat: z.string().max(10_000).or(z.literal("")),
    misi: z.string().max(20_000).or(z.literal("")),
    kelurahan: z.string().trim().max(120).or(z.literal("")),
    kecamatan: z.string().trim().max(120).or(z.literal("")),
    kota: z.string().trim().max(120).or(z.literal("")),
    provinsi: z.string().trim().max(120).or(z.literal("")),
    kodePos: z.string().trim().max(10).or(z.literal("")),
    whatsapp: z.string().trim().max(30).or(z.literal("")),
    website: z.string().trim().max(255).or(z.literal("")),
    kepalaLembaga: z.string().trim().max(120).or(z.literal("")),
  }).optional(),
  settings: z.object({
    siteTitle: z.string().trim().min(1).max(200),
    description: z.string().max(500),
    admissionStatus: z.string().max(200),
    admissionEnabled: z.boolean(),
  }).optional(),
  templateConfig: z.object({
    variant: z.string().trim().min(1).max(80),
    slots: z.record(z.string(), z.union([
      z.object({ source: z.literal("field"), key: z.string().trim().min(1).max(80) }).strict(),
      z.object({ source: z.literal("static"), value: z.string().max(2_000) }).strict(),
    ])),
  }).optional(),
  password: z.string().min(12).max(128).optional(),
})

export type RecordInput = z.infer<typeof recordSchema>
export type MutationInput = z.infer<typeof mutationSchema>
