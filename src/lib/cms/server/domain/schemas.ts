import { z } from "zod"
import { collectionFieldTypeValues } from "@/lib/cms/collection-field-types"
import { modules } from "./constants"

export const collectionFieldInputSchema = z.object({
  id: z.string().trim().max(80).optional(),
  key: z.string().trim().min(1).max(80),
  label: z.string().trim().min(1).max(120),
  fieldType: z.enum(collectionFieldTypeValues),
  required: z.boolean().optional(),
  isUnique: z.boolean().optional(),
  isListed: z.boolean().optional(),
  isSearchable: z.boolean().optional(),
  isFilterable: z.boolean().optional(),
  options: z.unknown().optional(),
  defaultValue: z.unknown().optional(),
  helpText: z.string().max(2_000).nullable().optional(),
  validation: z.record(z.string(), z.unknown()).optional(),
})

export const recordSchema = z.object({
  title: z.string().trim().min(1).max(200),
  slug: z.string().trim().max(500),
  description: z.string().max(20_000),
  fields: z.string().max(8_000),
  itemData: z.record(z.string(), z.unknown()).optional()
    .refine((value) => value === undefined || JSON.stringify(value).length <= 100_000, "Data field terlalu besar."),
  collectionFields: z.array(collectionFieldInputSchema).max(80).optional(),
  collectionMode: z.enum(["content", "form", "hybrid"]).optional(),
  collectionUrlPrefix: z.string().trim().max(80).optional(),
  status: z.string().max(40),
})

export const mutationSchema = z.object({
  module: z.enum(modules),
  id: z.string().uuid().optional(),
  record: recordSchema.optional(),
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
