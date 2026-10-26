export const richTextAllowedTags = ["p", "br", "strong", "b", "em", "i", "h2", "h3", "ul", "ol", "li", "blockquote", "a", "figure", "figcaption", "img", "iframe"] as const
export const richTextAllowedAttributes = {
  a: ["href", "title", "target", "rel"],
  img: ["src", "alt", "title", "width", "height", "loading"],
  iframe: ["src", "title", "loading", "referrerpolicy", "allow", "allowfullscreen"],
}
export const richTextAllowedSchemes = ["http", "https", "mailto"] as const
export const richTextAllowedIframeHostnames = ["www.youtube-nocookie.com", "www.youtube.com", "youtube.com", "player.vimeo.com", "vimeo.com", "www.vimeo.com"]

export function normalizeCmsLinkHref(value: string) {
  const href = value.trim()
  if (href.startsWith("/") && !href.startsWith("//")) return href
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

export function isCmsImageSource(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) return false
  try {
    const url = new URL(value, "https://cms.invalid")
    return url.origin === "https://cms.invalid" &&
      !url.search && !url.hash &&
      /^\/uploads\/[\da-f-]+\.(?:png|jpe?g|webp)$/i.test(url.pathname)
  } catch {
    return false
  }
}
