import "server-only"

import sanitizeHtml from "sanitize-html"
import {
  isCmsImageSource,
  normalizeCmsEmbedUrl,
  normalizeCmsLinkHref,
  richTextAllowedAttributes,
  richTextAllowedIframeHostnames,
  richTextAllowedSchemes,
  richTextAllowedTags,
} from "@/lib/cms/richtext-policy"

const iframeAllow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"

export function sanitizeCmsRichText(value: string) {
  return sanitizeHtml(value, {
    allowedTags: [...richTextAllowedTags],
    allowedAttributes: richTextAllowedAttributes,
    allowedSchemes: [...richTextAllowedSchemes],
    allowedIframeHostnames: richTextAllowedIframeHostnames,
    allowIframeRelativeUrls: false,
    transformTags: {
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
          title: (attributes.title ?? "Video tersemat").slice(0, 160),
          loading: "lazy",
          referrerpolicy: "strict-origin-when-cross-origin",
          allow: iframeAllow,
          allowfullscreen: "",
        },
      }),
    },
    exclusiveFilter: (frame) =>
      (frame.tag === "img" && !isCmsImageSource(frame.attribs.src ?? "")) ||
      (frame.tag === "iframe" && !normalizeCmsEmbedUrl(frame.attribs.src ?? ""))
        ? "excludeTag"
        : false,
  })
}
