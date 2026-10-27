const cmsTextAlignPattern = /^(?:left|center|right|justify)$/i
const cmsIndentPattern = /^(?:1\.5rem|3rem|4\.5rem|6rem)$/i
const cmsRgbColorPattern = /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/i
const cmsHexColorPattern = /^#[0-9a-f]{3,8}$/i
const cmsFontSizePattern = /^(?:0\.875rem|1rem|1\.125rem|1\.25rem|1\.5rem)$/i
const cmsMediaWidthPattern = /^(?:[2-9]\d|100)%$/
const cmsMediaMarginPattern = /^(?:auto|0|0px|0\.75rem|1rem|1\.25rem|1\.5rem)$/i
const cmsMediaMarginShorthandPattern = /^(?:auto|0|0px|0\.75rem|1rem|1\.25rem|1\.5rem)(?:\s+(?:auto|0|0px|0\.75rem|1rem|1\.25rem|1\.5rem)){0,3}$/i
const cmsMediaVerticalMarginPattern = /^(?:0|0px|0\.5rem|0\.75rem|1rem|1\.25rem|1\.5rem)$/i
const cmsMediaFloatPattern = /^(?:left|right|none)$/i

export const richTextBlockSelector = "p,h2,h3,blockquote,li,td,th"
export const cmsIndentSteps = ["1.5rem", "3rem", "4.5rem", "6rem"] as const

export const richTextAllowedTags = [
  "p", "br", "strong", "b", "em", "i", "u", "s", "strike", "sub", "sup", "span",
  "h2", "h3", "ul", "ol", "li", "blockquote", "a", "hr", "pre", "code",
  "table", "thead", "tbody", "tr", "th", "td", "caption",
  "figure", "figcaption", "img", "iframe", "video", "audio",
] as const
const blockStyleRules = {
  "text-align": [cmsTextAlignPattern],
  "margin-left": [cmsIndentPattern],
}
const cellStyleRules = {
  "text-align": [cmsTextAlignPattern],
}
const figureStyleRules = {
  width: [cmsMediaWidthPattern],
  float: [cmsMediaFloatPattern],
  margin: [cmsMediaMarginShorthandPattern],
  "margin-left": [cmsMediaMarginPattern],
  "margin-right": [cmsMediaMarginPattern],
  "margin-top": [cmsMediaVerticalMarginPattern],
  "margin-bottom": [cmsMediaVerticalMarginPattern],
}
export const richTextAllowedAttributes = {
  p: ["style"],
  h2: ["style"],
  h3: ["style"],
  blockquote: ["style"],
  li: ["style"],
  th: ["colspan", "rowspan", "style"],
  td: ["colspan", "rowspan", "style"],
  span: ["style"],
  figure: ["style"],
  a: ["href", "title", "target", "rel"],
  img: ["src", "alt", "title", "width", "height", "loading"],
  iframe: ["src", "title", "loading", "referrerpolicy", "allow", "allowfullscreen"],
  video: ["src", "title", "controls", "preload", "playsinline"],
  audio: ["src", "title", "controls", "preload"],
}
export const richTextAllowedStyles = {
  p: blockStyleRules,
  h2: blockStyleRules,
  h3: blockStyleRules,
  blockquote: blockStyleRules,
  li: blockStyleRules,
  th: cellStyleRules,
  td: cellStyleRules,
  figure: figureStyleRules,
  span: {
    color: [cmsRgbColorPattern, cmsHexColorPattern, /^currentcolor$/i, /^inherit$/i],
    "background-color": [cmsRgbColorPattern, cmsHexColorPattern, /^transparent$/i],
    "font-size": [cmsFontSizePattern],
  },
}
export const richTextAllowedSchemes = ["http", "https", "mailto"] as const
export const richTextAllowedIframeHostnames = ["www.youtube-nocookie.com", "www.youtube.com", "youtube.com", "player.vimeo.com", "vimeo.com", "www.vimeo.com"]

export function normalizeCmsTextAlign(value: string) {
  const align = value.trim().toLowerCase()
  return cmsTextAlignPattern.test(align) ? align : null
}

export function normalizeCmsIndent(value: string) {
  const indent = value.trim().toLowerCase()
  return cmsIndentPattern.test(indent) ? indent : null
}

export function normalizeCmsTextColor(value: string, allowTransparent = false) {
  const color = value.trim()
  if (/^currentcolor$/i.test(color) || /^inherit$/i.test(color)) return color.toLowerCase()
  if (allowTransparent && /^transparent$/i.test(color)) return "transparent"
  if (cmsHexColorPattern.test(color)) return color.toLowerCase()
  if (!cmsRgbColorPattern.test(color)) return null
  const channels = color.match(/\d{1,3}/g)?.map(Number)
  if (!channels || channels.length !== 3 || channels.some((channel) => channel > 255)) return null
  return `rgb(${channels.join(", ")})`
}

export function normalizeCmsFontSize(value: string) {
  const size = value.trim().toLowerCase()
  return cmsFontSizePattern.test(size) ? size : null
}

function normalizeCmsMediaWidth(value: string) {
  const width = value.trim().toLowerCase()
  return cmsMediaWidthPattern.test(width) ? width : null
}

function normalizeCmsMediaMargin(value: string) {
  const margin = value.trim().toLowerCase()
  if (margin === "auto" || margin === "0px") return margin
  if (margin === "0") return "0px"
  return cmsMediaMarginPattern.test(margin) ? margin : null
}

function normalizeCmsMediaMarginShorthand(value: string) {
  const parts = value.trim().toLowerCase().split(/\s+/)
  if (parts.length < 1 || parts.length > 4) return null
  if (!parts.every((part) => cmsMediaMarginPattern.test(part))) return null
  return parts.map((part) => part === "0" ? "0px" : part).join(" ")
}

function normalizeCmsMediaVerticalMargin(value: string) {
  const margin = value.trim().toLowerCase()
  if (margin === "0" || margin === "0px") return "0px"
  return cmsMediaVerticalMarginPattern.test(margin) ? margin : null
}

function normalizeCmsMediaFloat(value: string) {
  const float = value.trim().toLowerCase()
  return cmsMediaFloatPattern.test(float) ? float : null
}

const richTextStyleRules = richTextAllowedStyles as Record<string, Record<string, RegExp[]> | undefined>

export function sanitizeCmsStyleAttribute(tagName: string, value: string) {
  const tag = tagName.trim().toLowerCase()
  const rules = richTextStyleRules[tag]
  if (!rules) return ""

  const safe = new Map<string, string>()
  for (const declaration of value.split(";")) {
    const separator = declaration.indexOf(":")
    if (separator < 0) continue
    const property = declaration.slice(0, separator).trim().toLowerCase()
    const patterns = rules[property]
    if (!patterns) continue

    const raw = declaration.slice(separator + 1).trim()
    const normalized = property === "text-align"
      ? normalizeCmsTextAlign(raw)
      : property === "margin"
        ? tag === "figure" ? normalizeCmsMediaMarginShorthand(raw) : null
        : property === "margin-left"
          ? tag === "figure" ? normalizeCmsMediaMargin(raw) : normalizeCmsIndent(raw)
          : property === "margin-right"
          ? tag === "figure" ? normalizeCmsMediaMargin(raw) : null
          : property === "margin-top" || property === "margin-bottom"
            ? tag === "figure" ? normalizeCmsMediaVerticalMargin(raw) : null
            : property === "float"
              ? tag === "figure" ? normalizeCmsMediaFloat(raw) : null
              : property === "width"
                ? normalizeCmsMediaWidth(raw)
                : property === "font-size"
              ? normalizeCmsFontSize(raw)
              : property === "color"
                ? normalizeCmsTextColor(raw)
                : property === "background-color"
                  ? normalizeCmsTextColor(raw, true)
                  : null
    if (!normalized) continue
    if (!patterns.some((pattern) => {
      pattern.lastIndex = 0
      return pattern.test(normalized)
    })) continue
    safe.set(property, normalized)
  }

  return Array.from(safe, ([property, declaration]) => `${property}: ${declaration}`).join("; ")
}

export function normalizeCmsTableCellSpan(value: string | undefined) {
  const match = /^\d{1,2}$/.exec(value?.trim() ?? "")
  if (!match) return null
  const span = Number(match[0])
  return span >= 2 && span <= 20 ? String(span) : null
}

export type CmsUploadKind = "image" | "video" | "audio" | "document" | "other"

const uploadExtensions: Record<string, CmsUploadKind> = {
  png: "image",
  jpg: "image",
  jpeg: "image",
  webp: "image",
  gif: "image",
  mp4: "video",
  webm: "video",
  mov: "video",
  m4v: "video",
  avi: "video",
  mkv: "video",
  ogv: "video",
  mp3: "audio",
  wav: "audio",
  ogg: "audio",
  oga: "audio",
  m4a: "audio",
  flac: "audio",
  pdf: "document",
  doc: "document",
  docx: "document",
  xls: "document",
  xlsx: "document",
  ppt: "document",
  pptx: "document",
  odt: "document",
  ods: "document",
  odp: "document",
  rtf: "document",
  txt: "document",
  csv: "document",
  md: "document",
  zip: "other",
  rar: "other",
  "7z": "other",
}

export function cmsUploadExtension(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) return null
  try {
    const url = new URL(value, "https://cms.invalid")
    if (url.origin !== "https://cms.invalid" || url.search || url.hash) return null
    return /^\/uploads\/[\da-f-]+\.([a-z0-9]{1,10})$/i.exec(url.pathname)?.[1]?.toLowerCase() ?? null
  } catch {
    return null
  }
}

export function cmsUploadMediaKind(value: string): CmsUploadKind | null {
  const extension = cmsUploadExtension(value)
  return extension ? uploadExtensions[extension] ?? null : null
}

export function isCmsImageSource(value: string) {
  return cmsUploadMediaKind(value) === "image"
}

export function isCmsVideoSource(value: string) {
  return cmsUploadMediaKind(value) === "video"
}

export function isCmsAudioSource(value: string) {
  return cmsUploadMediaKind(value) === "audio"
}

export function isCmsPdfSource(value: string) {
  return cmsUploadMediaKind(value) === "document" && cmsUploadExtension(value) === "pdf"
}

export function normalizeCmsLinkHref(value: string) {
  const href = value.trim()
  if (!href || /[\\\u0000-\u001f\u007f]/.test(href)) return null
  if (href.startsWith("/") && !href.startsWith("//")) {
    try {
      return new URL(href, "https://cms.invalid").origin === "https://cms.invalid" ? href : null
    } catch {
      return null
    }
  }
  try {
    const url = new URL(href)
    if (url.username || url.password) return null
    return richTextAllowedSchemes.includes(url.protocol.replace(/:$/, "") as typeof richTextAllowedSchemes[number])
      ? href
      : null
  } catch {
    return null
  }
}

export function normalizeCmsEmbedUrl(value: string) {
  const localPdf = value.trim()
  if (isCmsPdfSource(localPdf)) return localPdf

  try {
    const url = new URL(value.trim())
    if (url.protocol !== "https:" && url.protocol !== "http:") return null
    if (url.username || url.password) return null
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "")

    if (hostname === "youtu.be" || hostname === "youtube.com" || hostname === "m.youtube.com" || hostname === "youtube-nocookie.com") {
      const segments = url.pathname.split("/").filter(Boolean)
      const videoId = hostname === "youtu.be"
        ? segments[0]
        : url.searchParams.get("v") || (segments[0] === "watch" ? undefined : segments.at(-1))
      if (!videoId || !/^[\w-]{11}$/.test(videoId)) return null
      if (segments.length && !["embed", "shorts", "live", "watch"].includes(segments[0]) && hostname !== "youtu.be") return null
      return `https://www.youtube-nocookie.com/embed/${videoId}`
    }

    if (hostname === "vimeo.com" || hostname === "player.vimeo.com") {
      const match = url.pathname.match(/\/(?:video\/)?(\d+)\/?$/)
      return match ? `https://player.vimeo.com/video/${match[1]}` : null
    }
    return null
  } catch {
    return null
  }
}
