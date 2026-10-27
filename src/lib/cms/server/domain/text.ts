import { cmsSlugify } from "@/lib/cms/slug"

export function slugify(value: string) {
  return cmsSlugify(value)
}

export function parseMetadata(value: string) {
  return Object.fromEntries(value.split(/[·;\n]/).flatMap((entry) => {
    const separator = entry.indexOf(":")
    if (separator < 1) return []
    return [[entry.slice(0, separator).trim().toLowerCase(), entry.slice(separator + 1).trim()]]
  }))
}

export function normalizePagePath(value: string, title: string) {
  const parts = (value || title).split("/").filter(Boolean).map((part) => slugify(part))
  if (!parts.length) return "/"
  return `/${parts.join("/")}`.slice(0, 500)
}
