import "server-only"

import sanitizeHtml from "sanitize-html"
import {
  isCmsAudioSource,
  isCmsImageSource,
  isCmsVideoSource,
  normalizeCmsEmbedUrl,
  normalizeCmsLinkHref,
  normalizeCmsTableCellSpan,
  richTextAllowedAttributes,
  richTextAllowedIframeHostnames,
  richTextAllowedSchemes,
  richTextAllowedStyles,
  richTextAllowedTags,
} from "@/lib/cms/richtext-policy"

const iframeAllow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"

function tableCellAttributes(attributes: Record<string, string>) {
  const colspan = normalizeCmsTableCellSpan(attributes.colspan)
  const rowspan = normalizeCmsTableCellSpan(attributes.rowspan)
  return {
    ...(colspan ? { colspan } : {}),
    ...(rowspan ? { rowspan } : {}),
    ...(attributes.style ? { style: attributes.style } : {}),
  }
}

export function sanitizeCmsRichText(value: string) {
  return sanitizeHtml(value, {
    allowedTags: [...richTextAllowedTags],
    allowedAttributes: richTextAllowedAttributes,
    allowedStyles: richTextAllowedStyles,
    allowedSchemes: [...richTextAllowedSchemes],
    allowedIframeHostnames: richTextAllowedIframeHostnames,
    allowIframeRelativeUrls: true,
    transformTags: {
      strike: "s",
      th: (_tagName, attributes) => ({ tagName: "th", attribs: tableCellAttributes(attributes) }),
      td: (_tagName, attributes) => ({ tagName: "td", attribs: tableCellAttributes(attributes) }),
      a: (_tagName, attributes) => {
        const href = normalizeCmsLinkHref(attributes.href ?? "")
        return {
          tagName: "a",
          attribs: {
            ...(href ? { href } : {}),
            ...(attributes.title ? { title: attributes.title.slice(0, 255) } : {}),
            ...(attributes.target === "_blank" ? { target: "_blank" } : {}),
            rel: "noopener noreferrer",
          },
        }
      },
      img: (_tagName, attributes) => ({
        tagName: "img",
        attribs: {
          src: isCmsImageSource(attributes.src ?? "") ? attributes.src! : "",
          alt: (attributes.alt ?? "").slice(0, 255),
          loading: "lazy",
        },
      }),
      iframe: (_tagName, attributes) => ({
        tagName: "iframe",
        attribs: {
          src: normalizeCmsEmbedUrl(attributes.src ?? "") ?? "",
          title: (attributes.title ?? "Video atau dokumen tersemat").slice(0, 160),
          loading: "lazy",
          referrerpolicy: "strict-origin-when-cross-origin",
          allow: iframeAllow,
          allowfullscreen: "",
        },
      }),
      video: (_tagName, attributes) => ({
        tagName: "video",
        attribs: {
          ...(isCmsVideoSource(attributes.src ?? "") ? { src: attributes.src! } : {}),
          ...(attributes.title ? { title: attributes.title.slice(0, 160) } : {}),
          controls: "",
          preload: "metadata",
          playsinline: "",
        },
      }),
      audio: (_tagName, attributes) => ({
        tagName: "audio",
        attribs: {
          ...(isCmsAudioSource(attributes.src ?? "") ? { src: attributes.src! } : {}),
          ...(attributes.title ? { title: attributes.title.slice(0, 160) } : {}),
          controls: "",
          preload: "metadata",
        },
      }),
    },
    exclusiveFilter: (frame) =>
      (frame.tag === "img" && !isCmsImageSource(frame.attribs.src ?? "")) ||
      (frame.tag === "iframe" && !normalizeCmsEmbedUrl(frame.attribs.src ?? "")) ||
      (frame.tag === "video" && !isCmsVideoSource(frame.attribs.src ?? "")) ||
      (frame.tag === "audio" && !isCmsAudioSource(frame.attribs.src ?? ""))
        ? "excludeTag"
        : false,
  })
}
