import { isCmsImageSource, normalizeCmsEmbedUrl, normalizeCmsLinkHref, richTextAllowedTags } from "@/lib/cms/richtext-policy"

const allowedTags = new Set(richTextAllowedTags.map((tag) => tag.toUpperCase()))

export function sanitizeCmsEditorHtml(value: string) {
  const document = new DOMParser().parseFromString(value, "text/html")

  function cleanNode(node: Node) {
    for (const child of Array.from(node.childNodes)) {
      if (!(child instanceof Element)) continue

      if (child.tagName === "DIV") {
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
        const title = child.getAttribute("title")?.slice(0, 160) || "Video tersemat"
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
      } else {
        for (const attribute of Array.from(child.attributes)) child.removeAttribute(attribute.name)
      }

      cleanNode(child)
    }
  }

  cleanNode(document.body)
  return document.body.innerHTML
}
