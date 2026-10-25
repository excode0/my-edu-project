export const richTextAllowedTags = ["p", "br", "strong", "b", "em", "i", "h2", "h3", "ul", "ol", "li", "blockquote", "a"] as const
export const richTextAllowedAttributes = { a: ["href", "title", "target", "rel"] }
export const richTextAllowedSchemes = ["http", "https", "mailto"] as const
