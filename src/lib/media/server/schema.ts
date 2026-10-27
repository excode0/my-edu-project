import { z } from "zod"

const nullableText = (max: number) => z.string().trim().max(max).nullable()

export const mediaMetadataSchema = z.object({
  id: z.string().uuid("Media tidak valid."),
  title: nullableText(200),
  altText: nullableText(255),
  caption: nullableText(2_000),
  folderId: z.string().uuid("Folder tidak valid.").nullable(),
})

export const mediaFolderSchema = z.object({
  name: z.string().trim().min(1, "Nama folder wajib diisi.").max(120, "Nama folder maksimal 120 karakter."),
})

export const mediaFolderUpdateSchema = mediaFolderSchema.extend({
  id: z.string().uuid("Folder tidak valid."),
})

export type MediaMetadataInput = z.infer<typeof mediaMetadataSchema>
export type MediaFolderInput = z.infer<typeof mediaFolderSchema>
export type MediaFolderUpdateInput = z.infer<typeof mediaFolderUpdateSchema>
