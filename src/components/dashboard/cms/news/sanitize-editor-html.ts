import { richTextAllowedSchemes, richTextAllowedTags } from "@/lib/cms/richtext-policy"

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
        const href = child.getAttribute("href")
        let safeHref: string | null = null
        if (href) {
          try {
            const url = new URL(href, "https://cms.invalid")
            if (richTextAllowedSchemes.includes(url.protocol.replace(/:$/, "") as typeof richTextAllowedSchemes[number])) safeHref = href
          } catch {
            safeHref = null
          }
        }
        const title = child.getAttribute("title")
        const target = child.getAttribute("target") === "_blank" ? "_blank" : null
        for (const attribute of Array.from(child.attributes)) child.removeAttribute(attribute.name)
        if (safeHref) child.setAttribute("href", safeHref)
        if (title) child.setAttribute("title", title)
        if (target) {
          child.setAttribute("target", target)
          child.setAttribute("rel", "noopener noreferrer")
        }
      } else {
        for (const attribute of Array.from(child.attributes)) child.removeAttribute(attribute.name)
      }

      cleanNode(child)
    }
  }

  cleanNode(document.body)
  return document.body.innerHTML
}
