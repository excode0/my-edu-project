import {
  isCmsAudioSource,
  isCmsImageSource,
  isCmsVideoSource,
  normalizeCmsEmbedUrl,
  normalizeCmsLinkHref,
  normalizeCmsTableCellSpan,
  richTextAllowedTags,
  sanitizeCmsStyleAttribute,
} from "@/lib/cms/richtext-policy"

const allowedTags = new Set(richTextAllowedTags.map((tag) => tag.toUpperCase()))
const styleBlockTags = new Set(["P", "H2", "H3", "BLOCKQUOTE", "LI", "TH", "TD", "FIGURE", "SPAN"])

export function sanitizeCmsEditorHtml(value: string) {
  const document = new DOMParser().parseFromString(value, "text/html")

  function cleanNode(node: Node) {
    for (const child of Array.from(node.childNodes)) {
      if (!(child instanceof Element)) continue

      if (["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE", "TEXTAREA"].includes(child.tagName)) {
        child.remove()
        continue
      }

      if (child.tagName === "STRIKE") {
        const replacement = document.createElement("s")
        replacement.append(...Array.from(child.childNodes))
        child.replaceWith(replacement)
        cleanNode(replacement)
        continue
      }

      if (child.tagName === "FIGURE" && child.parentElement?.closest("figure")) {
        const replacements = Array.from(child.childNodes)
        child.replaceWith(...replacements)
        replacements.forEach(cleanNode)
        continue
      }

      if (child.tagName === "DIV") {
        const hasBlockChild = Array.from(child.children).some((element) =>
          ["P", "DIV", "FIGURE", "IFRAME", "VIDEO", "AUDIO", "UL", "OL", "BLOCKQUOTE", "H2", "H3"].includes(element.tagName),
        )
        if (hasBlockChild) {
          const replacements = Array.from(child.childNodes)
          child.replaceWith(...replacements)
          replacements.forEach(cleanNode)
          continue
        }
        const paragraph = document.createElement("p")
        paragraph.append(...Array.from(child.childNodes))
        child.replaceWith(paragraph)
        cleanNode(paragraph)
        continue
      }

      if (!allowedTags.has(child.tagName)) {
        const replacements = Array.from(child.childNodes)
        child.replaceWith(...replacements)
        replacements.forEach(cleanNode)
        continue
      }

      if (child.tagName === "A") {
        const safeHref = normalizeCmsLinkHref(child.getAttribute("href") ?? "")
        const title = child.getAttribute("title")
        const target = child.getAttribute("target") === "_blank" ? "_blank" : null
        for (const attribute of Array.from(child.attributes)) child.removeAttribute(attribute.name)
        if (safeHref) child.setAttribute("href", safeHref)
        if (title) child.setAttribute("title", title)
        if (target) {
          child.setAttribute("target", target)
          child.setAttribute("rel", "noopener noreferrer")
        }
      } else if (child.tagName === "IMG") {
        const src = child.getAttribute("src") ?? ""
        const alt = child.getAttribute("alt")?.slice(0, 255) ?? ""
        for (const attribute of Array.from(child.attributes)) child.removeAttribute(attribute.name)
        if (!isCmsImageSource(src)) {
          child.remove()
          continue
        }
        child.setAttribute("src", src)
        child.setAttribute("alt", alt)
        child.setAttribute("loading", "lazy")
      } else if (child.tagName === "IFRAME") {
        const src = normalizeCmsEmbedUrl(child.getAttribute("src") ?? "")
        const title = child.getAttribute("title")?.slice(0, 160) || "Video atau dokumen tersemat"
        for (const attribute of Array.from(child.attributes)) child.removeAttribute(attribute.name)
        if (!src) {
          child.remove()
          continue
        }
        child.setAttribute("src", src)
        child.setAttribute("title", title)
        child.setAttribute("loading", "lazy")
        child.setAttribute("referrerpolicy", "strict-origin-when-cross-origin")
        child.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share")
        child.setAttribute("allowfullscreen", "")
      } else if (child.tagName === "VIDEO") {
        const src = child.getAttribute("src") ?? ""
        const title = child.getAttribute("title")?.slice(0, 160) ?? ""
        for (const attribute of Array.from(child.attributes)) child.removeAttribute(attribute.name)
        if (!isCmsVideoSource(src)) {
          child.remove()
          continue
        }
        child.setAttribute("src", src)
        if (title) child.setAttribute("title", title)
        child.setAttribute("controls", "")
        child.setAttribute("preload", "metadata")
        child.setAttribute("playsinline", "")
      } else if (child.tagName === "AUDIO") {
        const src = child.getAttribute("src") ?? ""
        const title = child.getAttribute("title")?.slice(0, 160) ?? ""
        for (const attribute of Array.from(child.attributes)) child.removeAttribute(attribute.name)
        if (!isCmsAudioSource(src)) {
          child.remove()
          continue
        }
        child.setAttribute("src", src)
        if (title) child.setAttribute("title", title)
        child.setAttribute("controls", "")
        child.setAttribute("preload", "metadata")
      } else if (child.tagName === "TH" || child.tagName === "TD") {
        const style = sanitizeCmsStyleAttribute(child.tagName, child.getAttribute("style") ?? "")
        const colspan = normalizeCmsTableCellSpan(child.getAttribute("colspan") ?? undefined)
        const rowspan = normalizeCmsTableCellSpan(child.getAttribute("rowspan") ?? undefined)
        for (const attribute of Array.from(child.attributes)) child.removeAttribute(attribute.name)
        if (style) child.setAttribute("style", style)
        if (colspan) child.setAttribute("colspan", colspan)
        if (rowspan) child.setAttribute("rowspan", rowspan)
      } else if (styleBlockTags.has(child.tagName)) {
        const style = sanitizeCmsStyleAttribute(child.tagName, child.getAttribute("style") ?? "")
        for (const attribute of Array.from(child.attributes)) child.removeAttribute(attribute.name)
        if (child.tagName === "SPAN" && !style) {
          const replacements = Array.from(child.childNodes)
          child.replaceWith(...replacements)
          replacements.forEach(cleanNode)
          continue
        }
        if (style) child.setAttribute("style", style)
      } else {
        for (const attribute of Array.from(child.attributes)) child.removeAttribute(attribute.name)
      }

      cleanNode(child)
    }
  }

  cleanNode(document.body)
  return document.body.innerHTML
}
