"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent, type MouseEvent, type PointerEvent as ReactPointerEvent } from "react"
import {
  Bold,
  ChevronDown,
  ChevronUp,
  Code2,
  FileText,
  Film,
  Heading2,
  Heading3,
  Highlighter,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListIndentDecrease,
  ListIndentIncrease,
  ListOrdered,
  Maximize2,
  Minimize2,
  Minus,
  Move,
  Music,
  Palette,
  PanelLeft,
  PanelRight,
  Pilcrow,
  Plus,
  Quote,
  Redo2,
  RemoveFormatting,
  Rows3,
  Columns3,
  SquareCode,
  Strikethrough,
  Subscript,
  Superscript,
  Table2,
  TextAlignCenter,
  TextAlignEnd,
  TextAlignJustify,
  TextAlignStart,
  TextWrap,
  Trash2,
  Underline,
  Undo2,
  Unlink,
  Upload,
} from "lucide-react"
import Image from "next/image"
import {
  cmsIndentSteps,
  cmsUploadExtension,
  cmsUploadMediaKind,
  normalizeCmsEmbedUrl,
  normalizeCmsIndent,
  normalizeCmsLinkHref,
  type CmsUploadKind,
} from "@/lib/cms/richtext-policy"
import { mediaAccept, mediaUploadHint } from "@/lib/media/upload-policy"
import type { CmsMediaUploadResult, CmsRecord } from "@/types/type-cms-api"
import { uploadCmsMedia } from "@/lib/cms/client/media-api"
import { sanitizeCmsEditorHtml } from "./sanitize-editor-html"

type InsertPanel = "link" | "media" | "embed" | "table" | "color" | "highlight" | "size" | null
type LibraryFilter = "all" | "image" | "video" | "audio" | "document"
type LibraryMedia = { record: CmsRecord; kind: CmsUploadKind; extension: string }
type InlineTag = "strong" | "em" | "u" | "s" | "sub" | "sup"
type Alignment = "left" | "center" | "right" | "justify"
type MediaKind = "Gambar" | "Video" | "Audio" | "Dokumen" | "Sematkan"
type MediaFloat = "none" | "left" | "right"
type MediaSelection = { kind: MediaKind; width: number; alignment: Exclude<Alignment, "justify">; float: MediaFloat }
type MediaOverlay = { left: number; top: number; width: number; height: number }

const inlineCommands: Record<InlineTag, { command: string; selector: string }> = {
  strong: { command: "bold", selector: "strong,b" },
  em: { command: "italic", selector: "em,i" },
  u: { command: "underline", selector: "u" },
  s: { command: "strikeThrough", selector: "s,strike" },
  sub: { command: "subscript", selector: "sub" },
  sup: { command: "superscript", selector: "sup" },
}

const blockSelector = "p,h2,h3,blockquote,li,td,th"

const textColors = [
  { label: "Gelap", value: "#0f172a" },
  { label: "Abu", value: "#475569" },
  { label: "Merah", value: "#b91c1c" },
  { label: "Oranye", value: "#c2410c" },
  { label: "Kuning tua", value: "#a16207" },
  { label: "Hijau", value: "#15803d" },
  { label: "Teal", value: "#0f766e" },
  { label: "Biru", value: "#1d4ed8" },
  { label: "Ungu", value: "#7e22ce" },
  { label: "Merah muda", value: "#be185d" },
] as const

const highlightColors = [
  { label: "Kuning", value: "#fef08a" },
  { label: "Oranye", value: "#fed7aa" },
  { label: "Merah", value: "#fecaca" },
  { label: "Hijau", value: "#bbf7d0" },
  { label: "Biru", value: "#bfdbfe" },
  { label: "Ungu", value: "#e9d5ff" },
  { label: "Pink", value: "#fbcfe8" },
] as const

const fontSizes = [
  { label: "Kecil", value: "0.875rem" },
  { label: "Normal", value: "1rem" },
  { label: "Sedang", value: "1.125rem" },
  { label: "Besar", value: "1.25rem" },
  { label: "Sangat besar", value: "1.5rem" },
] as const

const tableLimits = { rows: 20, columns: 8 }

const libraryFilters: { value: LibraryFilter; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "image", label: "Gambar" },
  { value: "video", label: "Video" },
  { value: "audio", label: "Audio" },
  { value: "document", label: "Dokumen" },
]

const playableVideoExtensions = new Set(["mp4", "webm", "mov", "m4v", "ogv"])

function hasRichTextContent(value: string) {
  const text = value
    .replace(/<br\s*\/?>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim()
  return Boolean(text || /<(?:img|iframe|video|audio|hr|table)\b/i.test(value))
}

function selectedElement(node: Node | null, selector: string, editor: HTMLElement | null) {
  const element = node instanceof Element ? node : node?.parentElement
  if (!element || !editor) return null
  const found = element.closest(selector)
  return found && editor.contains(found) ? found as HTMLElement : null
}

function commandActive(command: string) {
  try {
    return document.queryCommandState(command)
  } catch {
    return false
  }
}

function clampTableValue(value: number, max: number) {
  return Math.min(max, Math.max(1, Number.isFinite(value) ? Math.round(value) : 1))
}

function createTableCell(tagName: "th" | "td") {
  const cell = document.createElement(tagName)
  const paragraph = document.createElement("p")
  paragraph.append(document.createElement("br"))
  cell.append(paragraph)
  return cell
}

function addCaption(figure: HTMLElement, caption: string) {
  const text = caption.trim()
  if (!text) return
  const captionElement = document.createElement("figcaption")
  captionElement.textContent = text.slice(0, 500)
  figure.append(captionElement)
}

function mediaKindForFigure(figure: HTMLElement): MediaKind {
  if (figure.querySelector("img")) return "Gambar"
  if (figure.querySelector("video")) return "Video"
  if (figure.querySelector("audio")) return "Audio"
  const frame = figure.querySelector("iframe")
  if (frame?.getAttribute("src")?.toLowerCase().includes(".pdf")) return "Dokumen"
  return "Sematkan"
}

function mediaWidthForFigure(figure: HTMLElement) {
  const width = Number.parseFloat(figure.style.width)
  return figure.style.width.endsWith("%") && Number.isFinite(width)
    ? Math.min(100, Math.max(20, Math.round(width)))
    : 100
}

function mediaAlignmentForFigure(figure: HTMLElement) {
  const left = figure.style.marginLeft
  const right = figure.style.marginRight
  if (left === "auto" && right === "auto") return "center"
  if (left === "auto") return "right"
  return "left"
}

function mediaFloatForFigure(figure: HTMLElement): MediaFloat {
  const float = figure.style.float
  return float === "left" || float === "right" ? float : "none"
}

function mediaSelectionForFigure(figure: HTMLElement): MediaSelection {
  return {
    kind: mediaKindForFigure(figure),
    width: mediaWidthForFigure(figure),
    alignment: mediaAlignmentForFigure(figure),
    float: mediaFloatForFigure(figure),
  }
}

function mediaLayoutLabel(selection: MediaSelection) {
  if (selection.float === "left") return "teks kanan"
  if (selection.float === "right") return "teks kiri"
  return "tanpa apit"
}

function flattenToFragment(node: Node) {
  const fragment = document.createDocumentFragment()
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      fragment.append(document.createTextNode(child.textContent ?? ""))
    } else if (child.nodeName === "BR") {
      fragment.append(document.createElement("br"))
    } else if (child instanceof HTMLElement && ["IMG", "IFRAME", "VIDEO", "AUDIO"].includes(child.tagName)) {
      fragment.append(child.cloneNode(true))
    } else {
      fragment.append(flattenToFragment(child))
    }
  }
  return fragment
}

function mediaMatchesFilter(entry: LibraryMedia, filter: LibraryFilter) {
  if (filter === "all") return true
  if (filter === "document") return entry.kind === "document" || entry.kind === "other"
  return entry.kind === filter
}

export function CmsNewsBodyEditor({
  value,
  required,
  media,
  canUploadMedia,
  onUploaded,
  onChange,
}: {
  value: string
  required: boolean
  media: CmsRecord[]
  canUploadMedia: boolean
  onUploaded: () => Promise<void>
  onChange: (value: string) => void
}) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const uploadRef = useRef<HTMLInputElement>(null)
  const savedRangeRef = useRef<Range | null>(null)
  const selectedFigureRef = useRef<HTMLElement | null>(null)
  const lastPublishedRef = useRef<string | null>(null)
  const [panel, setPanel] = useState<InsertPanel>(null)
  const [linkUrl, setLinkUrl] = useState("")
  const [linkLabel, setLinkLabel] = useState("")
  const [linkNewTab, setLinkNewTab] = useState(false)
  const [embedUrl, setEmbedUrl] = useState("")
  const [mediaAlt, setMediaAlt] = useState("")
  const [mediaCaption, setMediaCaption] = useState("")
  const [mediaFilter, setMediaFilter] = useState<LibraryFilter>("all")
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set())
  const [mediaSelection, setMediaSelection] = useState<MediaSelection | null>(null)
  const [mediaOverlay, setMediaOverlay] = useState<MediaOverlay | null>(null)
  const [tableRows, setTableRows] = useState(2)
  const [tableColumns, setTableColumns] = useState(2)
  const [tableHeader, setTableHeader] = useState(true)

  const libraryItems = useMemo<LibraryMedia[]>(() => media.flatMap((record) => {
    const kind = cmsUploadMediaKind(record.slug)
    if (!kind) return []
    return [{ record, kind, extension: cmsUploadExtension(record.slug) ?? "" }]
  }), [media])

  const filteredLibrary = useMemo(
    () => libraryItems.filter((entry) => mediaMatchesFilter(entry, mediaFilter)),
    [libraryItems, mediaFilter],
  )

  const editorEmpty = !hasRichTextContent(value)

  const refreshActiveFormats = useCallback(() => {
    const editor = editorRef.current
    const selection = window.getSelection()
    if (!editor || !selection?.rangeCount || !editor.contains(selection.anchorNode)) {
      setActiveFormats(new Set())
      return
    }

    const node = selection.anchorNode
    const formats = new Set<string>()
    if (commandActive("bold")) formats.add("strong")
    if (commandActive("italic")) formats.add("em")
    if (commandActive("underline")) formats.add("u")
    if (commandActive("strikeThrough")) formats.add("s")
    if (commandActive("subscript")) formats.add("sub")
    if (commandActive("superscript")) formats.add("sup")
    if (selectedElement(node, "strong,b", editor)) formats.add("strong")
    if (selectedElement(node, "em,i", editor)) formats.add("em")
    if (selectedElement(node, "u", editor)) formats.add("u")
    if (selectedElement(node, "s,strike", editor)) formats.add("s")
    if (selectedElement(node, "sub", editor)) formats.add("sub")
    if (selectedElement(node, "sup", editor)) formats.add("sup")
    if (selectedElement(node, "pre,code", editor)) formats.add("code")
    if (selectedElement(node, "table", editor)) formats.add("table-cell")
    if (selectedElement(node, "h2", editor)) formats.add("h2")
    if (selectedElement(node, "h3", editor)) formats.add("h3")
    if (selectedElement(node, "blockquote", editor)) formats.add("blockquote")
    if (selectedElement(node, "ul", editor)) formats.add("ul")
    if (selectedElement(node, "ol", editor)) formats.add("ol")
    if (selectedElement(node, "a", editor)) formats.add("link")

    const block = selectedElement(node, blockSelector, editor)
    if (block && ["P", "DIV"].includes(block.tagName)) formats.add("p")
    const computedAlign = block ? window.getComputedStyle(block).textAlign : ""
    const alignment = computedAlign === "start" ? "left" : computedAlign === "end" ? "right" : computedAlign
    if (alignment === "left" || alignment === "center" || alignment === "right" || alignment === "justify") formats.add(`align-${alignment}`)
    setActiveFormats(formats)
  }, [])

  useEffect(() => {
    document.addEventListener("selectionchange", refreshActiveFormats)
    return () => document.removeEventListener("selectionchange", refreshActiveFormats)
  }, [refreshActiveFormats])

  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper || typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(() => {
      const figure = selectedFigureRef.current
      if (!figure) return
      const figureRect = figure.getBoundingClientRect()
      const wrapperRect = wrapper.getBoundingClientRect()
      setMediaOverlay({
        left: figureRect.left - wrapperRect.left,
        top: figureRect.top - wrapperRect.top,
        width: figureRect.width,
        height: figureRect.height,
      })
    })
    observer.observe(wrapper)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const editor = editorRef.current
    const externalChange = value !== lastPublishedRef.current
    if (editor && externalChange && document.activeElement !== editor && editor.innerHTML !== value) {
      editor.innerHTML = sanitizeCmsEditorHtml(value)
    }
    if (selectedFigureRef.current && (!editor || !editor.contains(selectedFigureRef.current))) {
      selectedFigureRef.current = null
      setMediaSelection(null)
      setMediaOverlay(null)
    }
  }, [value])

  function rememberSelection() {
    const editor = editorRef.current
    const selection = window.getSelection()
    if (editor && selection?.rangeCount && editor.contains(selection.anchorNode)) {
      savedRangeRef.current = selection.getRangeAt(0).cloneRange()
      refreshActiveFormats()
    }
  }

  function getEditorRange() {
    const editor = editorRef.current
    if (!editor) return null
    const selection = window.getSelection()
    if (selection?.rangeCount && editor.contains(selection.anchorNode)) {
      return selection.getRangeAt(0).cloneRange()
    }
    if (savedRangeRef.current && editor.contains(savedRangeRef.current.commonAncestorContainer)) {
      return savedRangeRef.current.cloneRange()
    }
    const range = document.createRange()
    range.selectNodeContents(editor)
    range.collapse(false)
    return range
  }

  function finishInsertion(range: Range, collapseToEnd = true) {
    const editor = editorRef.current
    if (!editor) return
    const selection = window.getSelection()
    if (collapseToEnd) range.collapse(false)
    selection?.removeAllRanges()
    selection?.addRange(range)
    savedRangeRef.current = range.cloneRange()
    editor.focus()
    publishChange()
    refreshActiveFormats()
  }

  function publishChange() {
    const editor = editorRef.current
    if (!editor) return
    const sanitized = sanitizeCmsEditorHtml(editor.innerHTML)
    lastPublishedRef.current = sanitized
    onChange(sanitized)
  }

  function updateMediaOverlay(figure: HTMLElement) {
    const wrapper = wrapperRef.current
    if (!wrapper) return
    const figureRect = figure.getBoundingClientRect()
    const wrapperRect = wrapper.getBoundingClientRect()
    setMediaOverlay({
      left: figureRect.left - wrapperRect.left,
      top: figureRect.top - wrapperRect.top,
      width: figureRect.width,
      height: figureRect.height,
    })
  }

  function clearMediaSelection() {
    selectedFigureRef.current = null
    setMediaSelection(null)
    setMediaOverlay(null)
  }

  function syncMediaSelection(figure: HTMLElement) {
    selectedFigureRef.current = figure
    setMediaSelection(mediaSelectionForFigure(figure))
    updateMediaOverlay(figure)
    requestAnimationFrame(() => {
      if (selectedFigureRef.current === figure) updateMediaOverlay(figure)
    })
  }

  function selectInsertedMedia(figure: HTMLElement) {
    syncMediaSelection(figure)
    requestAnimationFrame(() => {
      if (selectedFigureRef.current === figure && editorRef.current?.contains(figure)) {
        updateMediaOverlay(figure)
      }
    })
  }

  function handleEditorClick(event: MouseEvent<HTMLDivElement>) {
    const editor = editorRef.current
    if (!editor) return
    const target = event.target instanceof Element ? event.target.closest("figure") : null
    if (target instanceof HTMLElement && editor.contains(target)) {
      syncMediaSelection(target)
      return
    }
    clearMediaSelection()
  }

  function applyMediaWidth(figure: HTMLElement, nextWidth: number) {
    const width = Math.min(100, Math.max(20, Math.round(nextWidth)))
    if (width >= 100) figure.style.removeProperty("width")
    else figure.style.setProperty("width", `${width}%`)
    return width
  }

  function setMediaWidth(width: number) {
    const figure = selectedFigureRef.current
    if (!figure) return
    applyMediaWidth(figure, width)
    setMediaSelection(mediaSelectionForFigure(figure))
    updateMediaOverlay(figure)
    publishChange()
  }

  function resizeSelectedMedia(delta: number) {
    const figure = selectedFigureRef.current
    if (figure) setMediaWidth(mediaWidthForFigure(figure) + delta)
  }

  function setMediaAlignment(alignment: Exclude<Alignment, "justify">) {
    const figure = selectedFigureRef.current
    if (!figure) return
    figure.style.removeProperty("float")
    figure.style.removeProperty("margin-top")
    figure.style.removeProperty("margin-bottom")
    figure.style.setProperty("margin-left", alignment === "left" ? "0px" : "auto")
    figure.style.setProperty("margin-right", alignment === "right" ? "0px" : "auto")
    syncMediaSelection(figure)
    publishChange()
  }

  function setMediaFloat(float: MediaFloat) {
    const figure = selectedFigureRef.current
    if (!figure) return
    if (float === "none") {
      figure.style.removeProperty("float")
      figure.style.removeProperty("margin-top")
      figure.style.removeProperty("margin-bottom")
      figure.style.setProperty("margin-left", "0px")
      figure.style.setProperty("margin-right", "auto")
    } else {
      if (mediaWidthForFigure(figure) > 60) applyMediaWidth(figure, 50)
      figure.style.setProperty("float", float)
      figure.style.setProperty("margin-top", "0.75rem")
      figure.style.setProperty("margin-bottom", "1rem")
      figure.style.setProperty("margin-left", float === "right" ? "1.5rem" : "0px")
      figure.style.setProperty("margin-right", float === "left" ? "1.5rem" : "0px")
    }
    syncMediaSelection(figure)
    publishChange()
  }

  function moveSelectedMedia(direction: "up" | "down") {
    const figure = selectedFigureRef.current
    if (!figure) return
    const sibling = direction === "up" ? figure.previousElementSibling : figure.nextElementSibling
    if (!sibling) return
    if (direction === "up") sibling.before(figure)
    else sibling.after(figure)
    updateMediaOverlay(figure)
    publishChange()
  }

  function startMediaDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    event.preventDefault()
    const editor = editorRef.current
    const figure = selectedFigureRef.current
    if (!editor || !figure) return

    const handleMove = (moveEvent: PointerEvent) => {
      const target = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY)
      const block = target instanceof Element
        ? target.closest("p,h2,h3,blockquote,pre,table,figure,hr,ul,ol")
        : null
      if (!(block instanceof HTMLElement) || block === figure || !editor.contains(block) || figure.contains(block)) return
      const rect = block.getBoundingClientRect()
      if (moveEvent.clientY > rect.top + rect.height / 2) block.after(figure)
      else block.before(figure)
      updateMediaOverlay(figure)
    }

    const finishDrag = () => {
      document.removeEventListener("pointermove", handleMove)
      document.removeEventListener("pointerup", finishDrag)
      document.removeEventListener("pointercancel", finishDrag)
      syncMediaSelection(figure)
      publishChange()
    }

    document.addEventListener("pointermove", handleMove)
    document.addEventListener("pointerup", finishDrag)
    document.addEventListener("pointercancel", finishDrag)
  }

  function startMediaResize(event: ReactPointerEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.stopPropagation()
    const editor = editorRef.current
    const figure = selectedFigureRef.current
    if (!editor || !figure) return

    const style = window.getComputedStyle(editor)
    const contentWidth = editor.clientWidth - Number.parseFloat(style.paddingLeft) - Number.parseFloat(style.paddingRight)
    if (!Number.isFinite(contentWidth) || contentWidth <= 0) return
    const startX = event.clientX
    const startWidth = figure.getBoundingClientRect().width

    const handleMove = (moveEvent: PointerEvent) => {
      const nextWidth = ((startWidth + moveEvent.clientX - startX) / contentWidth) * 100
      applyMediaWidth(figure, Math.round(nextWidth / 5) * 5)
      setMediaSelection(mediaSelectionForFigure(figure))
      updateMediaOverlay(figure)
    }

    const finishResize = () => {
      document.removeEventListener("pointermove", handleMove)
      document.removeEventListener("pointerup", finishResize)
      document.removeEventListener("pointercancel", finishResize)
      syncMediaSelection(figure)
      publishChange()
    }

    document.addEventListener("pointermove", handleMove)
    document.addEventListener("pointerup", finishResize)
    document.addEventListener("pointercancel", finishResize)
  }

  function removeSelectedMedia() {
    const editor = editorRef.current
    const figure = selectedFigureRef.current
    if (!editor || !figure) return
    figure.remove()
    clearMediaSelection()
    if (!editor.querySelector("img,iframe,video,audio,table,hr,pre") && !editor.textContent?.trim()) {
      const paragraph = document.createElement("p")
      paragraph.append(document.createElement("br"))
      editor.append(paragraph)
      const range = document.createRange()
      range.selectNodeContents(paragraph)
      range.collapse(true)
      finishInsertion(range, false)
    } else {
      publishChange()
    }
  }

  function insertBlock(node: HTMLElement) {
    const editor = editorRef.current
    const range = getEditorRange()
    if (!editor || !range) return
    if (!range.collapsed) range.deleteContents()

    let figure = selectedElement(range.startContainer, "figure", editor)
    while (figure?.parentElement && figure.parentElement !== editor) {
      const parentFigure = figure.parentElement.closest("figure")
      if (!parentFigure || parentFigure === figure) break
      figure = parentFigure as HTMLElement
    }
    if (figure) {
      figure.after(node)
      const nextRange = document.createRange()
      nextRange.setStartAfter(node)
      finishInsertion(nextRange)
      return
    }

    const block = selectedElement(range.startContainer, "p,div,h2,h3,blockquote,pre,table", editor)
    if (!block || block === editor) {
      range.insertNode(node)
      const nextRange = document.createRange()
      nextRange.setStartAfter(node)
      finishInsertion(nextRange)
      return
    }

    const tailRange = document.createRange()
    tailRange.selectNodeContents(block)
    try {
      tailRange.setStart(range.endContainer, range.endOffset)
    } catch {
      tailRange.setStart(block, block.childNodes.length)
    }
    const tail = tailRange.extractContents()
    const tailBlock = block.tagName === "P" || block.tagName === "DIV"
      ? block.cloneNode(false) as HTMLElement
      : document.createElement("p")
    tailBlock.append(tail)
    const hasBlockContent = Boolean(block.textContent?.trim() || block.querySelector("img,iframe,video,audio"))
    block.after(node)
    if (!hasBlockContent) block.remove()

    const hasTail = Boolean(tailBlock.textContent?.trim() || tailBlock.querySelector("img,iframe,video,audio,br"))
    if (hasTail) {
      node.after(tailBlock)
      const nextRange = document.createRange()
      nextRange.selectNodeContents(tailBlock)
      nextRange.collapse(true)
      finishInsertion(nextRange, false)
    } else {
      const paragraph = document.createElement("p")
      paragraph.append(document.createElement("br"))
      node.after(paragraph)
      const nextRange = document.createRange()
      nextRange.selectNodeContents(paragraph)
      nextRange.collapse(true)
      finishInsertion(nextRange, false)
    }
  }

  function insertImage(src: string, alt: string, caption = mediaCaption) {
    const figure = document.createElement("figure")
    const image = document.createElement("img")
    image.src = src
    image.alt = alt.trim().slice(0, 255)
    image.loading = "lazy"
    figure.append(image)
    addCaption(figure, caption)
    insertBlock(figure)
    closeMediaPanel()
    selectInsertedMedia(figure)
  }

  function insertVideo(src: string, title: string, caption = mediaCaption) {
    const figure = document.createElement("figure")
    const video = document.createElement("video")
    video.src = src
    video.controls = true
    video.preload = "metadata"
    video.playsInline = true
    if (title.trim()) video.title = title.trim().slice(0, 160)
    figure.append(video)
    addCaption(figure, caption)
    insertBlock(figure)
    closeMediaPanel()
    selectInsertedMedia(figure)
  }

  function insertAudio(src: string, title: string, caption = mediaCaption) {
    const figure = document.createElement("figure")
    const audio = document.createElement("audio")
    audio.src = src
    audio.controls = true
    audio.preload = "metadata"
    if (title.trim()) audio.title = title.trim().slice(0, 160)
    figure.append(audio)
    addCaption(figure, caption)
    insertBlock(figure)
    closeMediaPanel()
    selectInsertedMedia(figure)
  }

  function insertPdf(src: string, title: string, caption = mediaCaption) {
    const figure = document.createElement("figure")
    const frame = document.createElement("iframe")
    frame.src = src
    frame.title = title.trim().slice(0, 160) || "Dokumen PDF"
    frame.loading = "lazy"
    figure.append(frame)
    addCaption(figure, caption)
    insertBlock(figure)
    closeMediaPanel()
    selectInsertedMedia(figure)
  }

  function insertFileLink(src: string, title: string) {
    const paragraph = document.createElement("p")
    const anchor = document.createElement("a")
    anchor.href = src
    anchor.textContent = title.trim().slice(0, 200) || "Buka lampiran"
    anchor.target = "_blank"
    anchor.rel = "noopener noreferrer"
    paragraph.append(anchor)
    insertBlock(paragraph)
    closeMediaPanel()
  }

  function closeMediaPanel() {
    setPanel(null)
    setError("")
    setMediaAlt("")
    setMediaCaption("")
  }

  function insertLibraryMedia(entry: LibraryMedia) {
    const title = entry.record.title
    if (entry.kind === "image") {
      insertImage(entry.record.slug, mediaAlt.trim() || title, mediaCaption)
    } else if (entry.kind === "video") {
      if (playableVideoExtensions.has(entry.extension)) insertVideo(entry.record.slug, title, mediaCaption)
      else insertFileLink(entry.record.slug, title)
    } else if (entry.kind === "audio") {
      insertAudio(entry.record.slug, title, mediaCaption)
    } else if (entry.kind === "document" && entry.extension === "pdf") {
      insertPdf(entry.record.slug, title, mediaCaption)
    } else {
      insertFileLink(entry.record.slug, title)
    }
  }

  function insertUploadedMedia(uploaded: CmsMediaUploadResult, file: File) {
    const title = file.name.replace(/\.[^.]+$/, "").trim().slice(0, 200) || file.name.slice(0, 200)
    if (uploaded.kind === "image") {
      insertImage(uploaded.publicUrl, mediaAlt.trim() || title, mediaCaption)
    } else if (uploaded.kind === "video") {
      if (playableVideoExtensions.has(uploaded.extension)) insertVideo(uploaded.publicUrl, title, mediaCaption)
      else insertFileLink(uploaded.publicUrl, title)
    } else if (uploaded.kind === "audio") {
      insertAudio(uploaded.publicUrl, title, mediaCaption)
    } else if (uploaded.kind === "document" && uploaded.extension === "pdf") {
      insertPdf(uploaded.publicUrl, title, mediaCaption)
    } else {
      insertFileLink(uploaded.publicUrl, title)
    }
  }

  function insertEmbed() {
    const src = normalizeCmsEmbedUrl(embedUrl)
    if (!src) {
      setError("Gunakan tautan video YouTube atau Vimeo yang valid.")
      return
    }
    const figure = document.createElement("figure")
    const frame = document.createElement("iframe")
    frame.src = src
    frame.title = "Video berita"
    frame.loading = "lazy"
    frame.referrerPolicy = "strict-origin-when-cross-origin"
    frame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    frame.allowFullscreen = true
    figure.append(frame)
    insertBlock(figure)
    setEmbedUrl("")
    setPanel(null)
    setError("")
    selectInsertedMedia(figure)
  }

  function insertLink() {
    const href = normalizeCmsLinkHref(linkUrl)
    if (!href) {
      setError("Tautan harus memakai http, https, mailto, atau alamat internal yang diawali /.")
      return
    }
    const editor = editorRef.current
    const range = getEditorRange()
    if (!editor || !range) return

    const existing = selectedElement(range.startContainer, "a", editor)
    if (existing) {
      existing.setAttribute("href", href)
      existing.setAttribute("rel", "noopener noreferrer")
      if (linkNewTab) existing.setAttribute("target", "_blank")
      else existing.removeAttribute("target")
      if (range.collapsed && linkLabel.trim() && existing.textContent !== linkLabel.trim()) {
        existing.textContent = linkLabel.trim()
      }
      const nextRange = document.createRange()
      nextRange.selectNodeContents(existing)
      finishInsertion(nextRange)
    } else {
      const anchor = document.createElement("a")
      anchor.href = href
      anchor.rel = "noopener noreferrer"
      if (linkNewTab) anchor.target = "_blank"
      if (range.collapsed) anchor.textContent = linkLabel.trim() || href
      else anchor.append(range.extractContents())
      range.deleteContents()
      range.insertNode(anchor)
      const nextRange = document.createRange()
      nextRange.setStartAfter(anchor)
      finishInsertion(nextRange)
    }

    setLinkUrl("")
    setLinkLabel("")
    setLinkNewTab(false)
    setPanel(null)
    setError("")
  }

  function removeLink() {
    const editor = editorRef.current
    const range = getEditorRange()
    const anchor = range ? selectedElement(range.startContainer, "a", editor) : null
    if (!anchor) {
      setError("Letakkan kursor di dalam tautan yang ingin dihapus.")
      return
    }
    const children = Array.from(anchor.childNodes)
    anchor.replaceWith(...children)
    const nextRange = document.createRange()
    if (children.length) {
      nextRange.setStartAfter(children[children.length - 1])
      nextRange.collapse(true)
    } else if (editor) {
      nextRange.selectNodeContents(editor)
      nextRange.collapse(false)
    }
    finishInsertion(nextRange)
    setLinkUrl("")
    setLinkLabel("")
    setLinkNewTab(false)
    setPanel(null)
    setError("")
  }

  function toggleInline(tag: InlineTag) {
    const editor = editorRef.current
    const range = getEditorRange()
    if (!editor || !range) return
    const { command, selector } = inlineCommands[tag]

    if (range.collapsed) {
      const selection = window.getSelection()
      editor.focus()
      selection?.removeAllRanges()
      selection?.addRange(range)
      document.execCommand(command)
      savedRangeRef.current = selection?.rangeCount ? selection.getRangeAt(0).cloneRange() : range.cloneRange()
      publishChange()
      refreshActiveFormats()
      return
    }

    const existing = selectedElement(range.startContainer, selector, editor)
    if (existing) {
      const children = Array.from(existing.childNodes)
      existing.replaceWith(...children)
      const nextRange = document.createRange()
      if (children.length) {
        nextRange.setStartBefore(children[0])
        nextRange.setEndAfter(children[children.length - 1])
      } else {
        nextRange.selectNodeContents(editor)
        nextRange.collapse(false)
      }
      finishInsertion(nextRange, false)
      return
    }

    const wrapper = document.createElement(tag)
    const contents = range.extractContents()
    if (contents.childNodes.length) wrapper.append(contents)
    range.insertNode(wrapper)
    const nextRange = document.createRange()
    nextRange.selectNodeContents(wrapper)
    finishInsertion(nextRange, false)
  }

  function toggleBlock(tag: "p" | "h2" | "h3" | "blockquote") {
    const editor = editorRef.current
    const range = getEditorRange()
    if (!editor || !range || selectedElement(range.startContainer, "figure", editor)) return

    const block = selectedElement(range.startContainer, "p,div,h2,h3,blockquote", editor)
    const target = tag !== "p" && block && block !== editor && block.tagName.toLowerCase() === tag ? "p" : tag

    if (block && block !== editor) {
      const wrapper = document.createElement(target)
      wrapper.append(...Array.from(block.childNodes))
      block.replaceWith(wrapper)
      const nextRange = document.createRange()
      nextRange.selectNodeContents(wrapper)
      finishInsertion(nextRange)
      return
    }

    const wrapper = document.createElement(target)
    const contents = range.extractContents()
    if (contents.childNodes.length) wrapper.append(contents)
    else wrapper.append(document.createElement("br"))
    range.insertNode(wrapper)
    const nextRange = document.createRange()
    nextRange.selectNodeContents(wrapper)
    finishInsertion(nextRange)
  }

  function toggleList(tag: "ul" | "ol") {
    const editor = editorRef.current
    const range = getEditorRange()
    if (!editor || !range || selectedElement(range.startContainer, "figure", editor)) return

    const list = selectedElement(range.startContainer, "ul,ol", editor)
    if (list) {
      if (list.tagName.toLowerCase() === tag) {
        const paragraphs = Array.from(list.children)
          .filter((child) => child.tagName === "LI")
          .map((item) => {
            const paragraph = document.createElement("p")
            paragraph.append(...Array.from(item.childNodes))
            return paragraph
          })
        if (paragraphs.length) {
          list.replaceWith(...paragraphs)
          const nextRange = document.createRange()
          nextRange.selectNodeContents(paragraphs[paragraphs.length - 1])
          finishInsertion(nextRange)
        } else {
          list.remove()
          const nextRange = document.createRange()
          nextRange.selectNodeContents(editor)
          nextRange.collapse(false)
          finishInsertion(nextRange)
        }
      } else {
        const replacement = document.createElement(tag)
        replacement.append(...Array.from(list.childNodes))
        list.replaceWith(replacement)
        const nextRange = document.createRange()
        nextRange.selectNodeContents(replacement)
        finishInsertion(nextRange)
      }
      return
    }

    const block = selectedElement(range.startContainer, "p,div,h2,h3,blockquote", editor)
    const listElement = document.createElement(tag)
    const item = document.createElement("li")
    if (block && block !== editor) {
      item.append(...Array.from(block.childNodes))
      listElement.append(item)
      block.replaceWith(listElement)
    } else {
      const contents = range.extractContents()
      if (contents.childNodes.length) item.append(contents)
      else item.append(document.createElement("br"))
      listElement.append(item)
      range.insertNode(listElement)
    }
    const nextRange = document.createRange()
    nextRange.selectNodeContents(item)
    finishInsertion(nextRange)
  }

  function selectedBlocks(range: Range) {
    const editor = editorRef.current
    if (!editor) return []
    const blocks = Array.from(editor.querySelectorAll<HTMLElement>(blockSelector))
      .filter((block) => !block.closest("figure") && range.intersectsNode(block))
    if (blocks.length) return blocks
    const current = selectedElement(range.startContainer, blockSelector, editor)
    return current ? [current] : []
  }

  function restoreSelection(range: Range) {
    const editor = editorRef.current
    if (!editor) return
    editor.focus()
    const selection = window.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)
    savedRangeRef.current = range.cloneRange()
  }

  function applyBlockAlignment(alignment: Alignment) {
    const range = getEditorRange()
    if (!range) return
    const blocks = selectedBlocks(range)
    if (!blocks.length) return
    for (const block of blocks) {
      if (alignment === "left") block.style.removeProperty("text-align")
      else block.style.setProperty("text-align", alignment)
      if (!block.getAttribute("style")?.trim()) block.removeAttribute("style")
    }
    restoreSelection(range)
    publishChange()
    refreshActiveFormats()
  }

  function changeIndent(direction: "in" | "out") {
    const range = getEditorRange()
    if (!range) return
    const blocks = selectedBlocks(range)
    if (!blocks.length) return
    for (const block of blocks) {
      const current = normalizeCmsIndent(block.style.marginLeft)
      const currentIndex = current ? cmsIndentSteps.indexOf(current as typeof cmsIndentSteps[number]) : -1
      const nextIndex = direction === "in"
        ? (currentIndex < 0 ? 0 : Math.min(currentIndex + 1, cmsIndentSteps.length - 1))
        : currentIndex - 1
      if (nextIndex < 0) block.style.removeProperty("margin-left")
      else block.style.setProperty("margin-left", cmsIndentSteps[nextIndex])
      if (!block.getAttribute("style")?.trim()) block.removeAttribute("style")
    }
    restoreSelection(range)
    publishChange()
    refreshActiveFormats()
  }

  function selectedTextNodes(range: Range) {
    const editor = editorRef.current
    if (!editor) return []
    const nodes: Text[] = []
    const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT)
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (node instanceof Text && node.nodeValue && range.intersectsNode(node)) nodes.push(node)
    }
    return nodes
  }

  function applyInlineStyle(property: "color" | "background-color" | "font-size", value: string) {
    const range = getEditorRange()
    if (!range) return

    if (range.collapsed) {
      const span = document.createElement("span")
      span.style.setProperty(property, value)
      span.append(document.createTextNode("\u200B"))
      range.insertNode(span)
      const nextRange = document.createRange()
      nextRange.setStart(span.firstChild as Text, 1)
      nextRange.collapse(true)
      finishInsertion(nextRange, false)
      setPanel(null)
      return
    }

    const wrappers: HTMLElement[] = []
    for (const node of selectedTextNodes(range).reverse()) {
      const nodeRange = document.createRange()
      nodeRange.selectNodeContents(node)
      if (node === range.startContainer) nodeRange.setStart(node, range.startOffset)
      if (node === range.endContainer) nodeRange.setEnd(node, range.endOffset)
      if (nodeRange.collapsed) continue
      const span = document.createElement("span")
      span.style.setProperty(property, value)
      try {
        nodeRange.surroundContents(span)
        wrappers.push(span)
      } catch {
        continue
      }
    }
    if (!wrappers.length) return

    const ordered = wrappers.sort((first, second) =>
      first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
    )
    const nextRange = document.createRange()
    nextRange.setStartBefore(ordered[0])
    nextRange.setEndAfter(ordered[ordered.length - 1])
    finishInsertion(nextRange, false)
    setPanel(null)
  }

  function resetInlineStyle(property: "color" | "background-color" | "font-size") {
    applyInlineStyle(property, property === "color" ? "inherit" : property === "background-color" ? "transparent" : "1rem")
  }

  function insertHorizontalRule() {
    const rule = document.createElement("hr")
    insertBlock(rule)
  }

  function toggleCodeBlock() {
    const editor = editorRef.current
    const range = getEditorRange()
    if (!editor || !range) return
    const existing = selectedElement(range.startContainer, "pre", editor)
    if (existing) {
      const paragraph = document.createElement("p")
      const text = existing.textContent ?? ""
      paragraph.textContent = text
      if (!text) paragraph.append(document.createElement("br"))
      existing.replaceWith(paragraph)
      const nextRange = document.createRange()
      nextRange.selectNodeContents(paragraph)
      nextRange.collapse(true)
      finishInsertion(nextRange, false)
      return
    }

    const pre = document.createElement("pre")
    const code = document.createElement("code")
    if (!range.collapsed) code.textContent = range.extractContents().textContent ?? ""
    pre.append(code)
    insertBlock(pre)
    const nextRange = document.createRange()
    nextRange.selectNodeContents(code)
    nextRange.collapse(true)
    finishInsertion(nextRange, false)
  }

  function focusTableCell(cell: HTMLTableCellElement) {
    const target = cell.querySelector("p") ?? cell
    const range = document.createRange()
    range.selectNodeContents(target)
    range.collapse(true)
    finishInsertion(range, false)
  }

  function replaceTableWithParagraph(table: HTMLTableElement) {
    const paragraph = document.createElement("p")
    paragraph.append(document.createElement("br"))
    table.replaceWith(paragraph)
    const range = document.createRange()
    range.selectNodeContents(paragraph)
    range.collapse(true)
    finishInsertion(range, false)
  }

  function insertTable() {
    const rows = clampTableValue(tableRows, tableLimits.rows)
    const columns = clampTableValue(tableColumns, tableLimits.columns)
    const table = document.createElement("table")
    const body = document.createElement("tbody")
    for (let rowIndex = 0; rowIndex < rows; rowIndex += 1) {
      const row = document.createElement("tr")
      for (let columnIndex = 0; columnIndex < columns; columnIndex += 1) {
        row.append(createTableCell(tableHeader && rowIndex === 0 ? "th" : "td"))
      }
      body.append(row)
    }
    table.append(body)
    insertBlock(table)
    const firstCell = table.querySelector<HTMLTableCellElement>("th,td")
    if (firstCell) focusTableCell(firstCell)
    setPanel(null)
  }

  function currentTableCell() {
    const range = getEditorRange()
    const cell = range ? selectedElement(range.startContainer, "td,th", editorRef.current) : null
    if (!(cell instanceof HTMLTableCellElement)) {
      setError("Letakkan kursor di dalam sel tabel terlebih dahulu.")
      return null
    }
    return cell
  }

  function addTableRow() {
    const cell = currentTableCell()
    if (!cell) return
    const row = cell.parentElement as HTMLTableRowElement
    const nextRow = document.createElement("tr")
    for (let index = 0; index < row.cells.length; index += 1) nextRow.append(createTableCell("td"))
    row.after(nextRow)
    focusTableCell(nextRow.cells[0])
  }

  function addTableColumn() {
    const cell = currentTableCell()
    if (!cell) return
    const table = cell.closest("table")
    if (!(table instanceof HTMLTableElement)) return
    const columnIndex = cell.cellIndex
    const rows = Array.from(table.rows)
    for (const row of rows) {
      const nextCell = createTableCell(row.cells[0]?.tagName === "TH" ? "th" : "td")
      row.cells[Math.min(columnIndex, row.cells.length - 1)]?.after(nextCell)
    }
    const targetRow = cell.parentElement as HTMLTableRowElement
    focusTableCell(targetRow.cells[columnIndex + 1] ?? targetRow.cells[columnIndex])
  }

  function deleteTableRow() {
    const cell = currentTableCell()
    if (!cell) return
    const row = cell.parentElement as HTMLTableRowElement
    const table = cell.closest("table")
    if (!(table instanceof HTMLTableElement)) return
    const nextRow = (row.nextElementSibling ?? row.previousElementSibling) as HTMLTableRowElement | null
    row.remove()
    if (!table.rows.length) replaceTableWithParagraph(table)
    else if (nextRow) focusTableCell(nextRow.cells[Math.min(cell.cellIndex, nextRow.cells.length - 1)])
  }

  function deleteTableColumn() {
    const cell = currentTableCell()
    if (!cell) return
    const row = cell.parentElement as HTMLTableRowElement
    const table = cell.closest("table")
    if (!(table instanceof HTMLTableElement)) return
    const columnIndex = cell.cellIndex
    const rows = Array.from(table.rows)
    for (const tableRow of rows) tableRow.cells[columnIndex]?.remove()
    if (!table.rows[0]?.cells.length) replaceTableWithParagraph(table)
    else focusTableCell(row.cells[Math.min(columnIndex, row.cells.length - 1)])
  }

  function deleteTable() {
    const range = getEditorRange()
    const table = range ? selectedElement(range.startContainer, "table", editorRef.current) : null
    if (!(table instanceof HTMLTableElement)) {
      setError("Letakkan kursor di dalam tabel yang ingin dihapus.")
      return
    }
    replaceTableWithParagraph(table)
  }

  function runHistory(command: "undo" | "redo") {
    const editor = editorRef.current
    if (!editor) return
    editor.focus()
    document.execCommand(command)
    publishChange()
    refreshActiveFormats()
  }

  function clearFormatting() {
    const editor = editorRef.current
    const range = getEditorRange()
    if (!editor || !range || range.collapsed) return

    if (document.execCommand("removeFormat")) {
      const selection = window.getSelection()
      const nextRange = selection?.rangeCount ? selection.getRangeAt(0).cloneRange() : range
      finishInsertion(nextRange, false)
      return
    }

    const plain = flattenToFragment(range.extractContents())
    const last = plain.lastChild
    range.insertNode(plain)
    const nextRange = document.createRange()
    if (last) {
      nextRange.setStartAfter(last)
      nextRange.collapse(true)
    } else {
      nextRange.selectNodeContents(editor)
      nextRange.collapse(false)
    }
    finishInsertion(nextRange)
  }

  async function uploadMediaFile(file: File) {
    if (!canUploadMedia) {
      setError("Akun ini tidak memiliki izin mengunggah media.")
      return
    }
    if (uploading) return
    setUploading(true)
    setError("")
    try {
      const form = new FormData()
      form.set("file", file)
      form.set("title", file.name.replace(/\.[^.]+$/, "").trim().slice(0, 200) || file.name.slice(0, 200))
      if (mediaAlt.trim()) form.set("altText", mediaAlt.trim().slice(0, 255))
      if (mediaCaption.trim()) form.set("caption", mediaCaption.trim().slice(0, 2_000))
      const uploaded = await uploadCmsMedia(form)
      insertUploadedMedia(uploaded, file)
      try {
        await onUploaded()
      } catch {
        setError("Media berhasil diunggah dan disisipkan, tetapi pustaka media gagal diperbarui.")
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Media tidak dapat diunggah.")
    } finally {
      setUploading(false)
    }
  }

  async function handleMediaUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ""
    if (file) await uploadMediaFile(file)
  }

  function togglePanel(nextPanel: Exclude<InsertPanel, null>) {
    rememberSelection()
    setError("")

    if (nextPanel === "link") {
      const editor = editorRef.current
      const range = getEditorRange()
      const anchor = range ? selectedElement(range.startContainer, "a", editor) : null
      if (anchor) {
        setLinkUrl(anchor.getAttribute("href") ?? "")
        setLinkLabel(anchor.textContent?.trim().slice(0, 200) ?? "")
        setLinkNewTab(anchor.getAttribute("target") === "_blank")
      } else {
        setLinkUrl("")
        setLinkLabel(range && !range.collapsed ? range.toString().trim().slice(0, 200) : "")
        setLinkNewTab(false)
      }
    }

    setPanel((current) => current === nextPanel ? null : nextPanel)
  }

  function openPanel(event: MouseEvent<HTMLButtonElement>, nextPanel: Exclude<InsertPanel, null>) {
    event.preventDefault()
    togglePanel(nextPanel)
  }

  function insertPlainText(text: string) {
    const range = getEditorRange()
    if (!range) return
    range.deleteContents()
    const lines = text.replace(/\r\n?/g, "\n").split("\n")
    const fragment = document.createDocumentFragment()
    lines.forEach((line, index) => {
      if (index > 0) fragment.append(document.createElement("br"))
      fragment.append(document.createTextNode(line))
    })
    const last = fragment.lastChild
    range.insertNode(fragment)
    const nextRange = document.createRange()
    if (last) {
      nextRange.setStartAfter(last)
      nextRange.collapse(true)
    } else {
      nextRange.collapse(true)
    }
    finishInsertion(nextRange)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const modifier = event.ctrlKey || event.metaKey
    if (modifier && !event.altKey) {
      const key = event.key.toLowerCase()
      if (key === "b") {
        event.preventDefault()
        toggleInline("strong")
        return
      }
      if (key === "i") {
        event.preventDefault()
        toggleInline("em")
        return
      }
      if (key === "u" && !event.shiftKey) {
        event.preventDefault()
        toggleInline("u")
        return
      }
      if (key === "x" && event.shiftKey) {
        event.preventDefault()
        toggleInline("s")
        return
      }
      if (key === "k") {
        event.preventDefault()
        togglePanel("link")
        return
      }
    }

    const editor = editorRef.current
    if (event.key === "Tab" && editor && selectedElement(window.getSelection()?.anchorNode ?? null, "pre", editor)) {
      event.preventDefault()
      insertPlainText("  ")
      return
    }

    if (event.key !== "Enter" || event.shiftKey) return

    if (editor && selectedElement(window.getSelection()?.anchorNode ?? null, "pre", editor)) {
      event.preventDefault()
      document.execCommand("insertLineBreak")
      publishChange()
      refreshActiveFormats()
      return
    }

    const block = selectedElement(window.getSelection()?.anchorNode ?? null, "h2,h3,blockquote", editor)
    if (!block || !editor) return

    const range = getEditorRange()
    if (!range) return
    if (!range.collapsed) range.deleteContents()

    const tailRange = document.createRange()
    tailRange.selectNodeContents(block)
    try {
      tailRange.setStart(range.endContainer, range.endOffset)
    } catch {
      tailRange.setStart(block, block.childNodes.length)
    }
    const paragraph = document.createElement("p")
    const tail = tailRange.extractContents()
    paragraph.append(tail)
    if (!paragraph.textContent?.trim() && !paragraph.querySelector("img,iframe,video,audio,br")) {
      paragraph.append(document.createElement("br"))
    }
    const hasBlockContent = Boolean(block.textContent?.trim() || block.querySelector("img,iframe,video,audio"))
    block.after(paragraph)
    if (!hasBlockContent) block.remove()
    const nextRange = document.createRange()
    nextRange.selectNodeContents(paragraph)
    nextRange.collapse(true)
    event.preventDefault()
    finishInsertion(nextRange, false)
  }

  return (
    <div ref={wrapperRef} className="relative overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100">
      <div className="border-b border-slate-100 bg-slate-50">
        <div className="flex flex-wrap items-center gap-1 px-2 pt-2">
          <span className="mr-1 px-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Paragraf</span>
          <ToolbarButton label="Paragraf normal" active={activeFormats.has("p")} onClick={() => toggleBlock("p")}><Pilcrow className="size-4" /></ToolbarButton>
          <ToolbarButton label="Subjudul" active={activeFormats.has("h2")} onClick={() => toggleBlock("h2")}><Heading2 className="size-4" /></ToolbarButton>
          <ToolbarButton label="Subjudul kecil" active={activeFormats.has("h3")} onClick={() => toggleBlock("h3")}><Heading3 className="size-4" /></ToolbarButton>
          <ToolbarButton label="Kutipan" active={activeFormats.has("blockquote")} onClick={() => toggleBlock("blockquote")}><Quote className="size-4" /></ToolbarButton>
          <ToolbarButton label="Daftar berpoin" active={activeFormats.has("ul")} onClick={() => toggleList("ul")}><List className="size-4" /></ToolbarButton>
          <ToolbarButton label="Daftar bernomor" active={activeFormats.has("ol")} onClick={() => toggleList("ol")}><ListOrdered className="size-4" /></ToolbarButton>
          <ToolbarButton label="Garis pemisah" onClick={insertHorizontalRule}><Minus className="size-4" /></ToolbarButton>
          <span className="mx-1 h-5 w-px bg-slate-200" />
          <ToolbarButton label="Rata kiri" active={activeFormats.has("align-left")} onClick={() => applyBlockAlignment("left")}><TextAlignStart className="size-4" /></ToolbarButton>
          <ToolbarButton label="Rata tengah" active={activeFormats.has("align-center")} onClick={() => applyBlockAlignment("center")}><TextAlignCenter className="size-4" /></ToolbarButton>
          <ToolbarButton label="Rata kanan" active={activeFormats.has("align-right")} onClick={() => applyBlockAlignment("right")}><TextAlignEnd className="size-4" /></ToolbarButton>
          <ToolbarButton label="Rata kiri kanan" active={activeFormats.has("align-justify")} onClick={() => applyBlockAlignment("justify")}><TextAlignJustify className="size-4" /></ToolbarButton>
          <ToolbarButton label="Kurangi indentasi" onClick={() => changeIndent("out")}><ListIndentDecrease className="size-4" /></ToolbarButton>
          <ToolbarButton label="Tambah indentasi" onClick={() => changeIndent("in")}><ListIndentIncrease className="size-4" /></ToolbarButton>
          <span className="mx-1 h-5 w-px bg-slate-200" />
          <ToolbarButton label="Urungkan" onClick={() => runHistory("undo")}><Undo2 className="size-4" /></ToolbarButton>
          <ToolbarButton label="Ulangi" onClick={() => runHistory("redo")}><Redo2 className="size-4" /></ToolbarButton>
        </div>

        <div className="flex flex-wrap items-center gap-1 px-2 py-2">
          <span className="mr-1 px-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Format</span>
          <ToolbarButton label="Tebalkan" active={activeFormats.has("strong")} onClick={() => toggleInline("strong")}><Bold className="size-4" /></ToolbarButton>
          <ToolbarButton label="Miring" active={activeFormats.has("em")} onClick={() => toggleInline("em")}><Italic className="size-4" /></ToolbarButton>
          <ToolbarButton label="Garis bawah" active={activeFormats.has("u")} onClick={() => toggleInline("u")}><Underline className="size-4" /></ToolbarButton>
          <ToolbarButton label="Coret" active={activeFormats.has("s")} onClick={() => toggleInline("s")}><Strikethrough className="size-4" /></ToolbarButton>
          <ToolbarButton label="Subskrip" active={activeFormats.has("sub")} onClick={() => toggleInline("sub")}><Subscript className="size-4" /></ToolbarButton>
          <ToolbarButton label="Superskrip" active={activeFormats.has("sup")} onClick={() => toggleInline("sup")}><Superscript className="size-4" /></ToolbarButton>
          <ToolbarButton label="Warna teks" active={panel === "color"} onClick={(event) => openPanel(event, "color")}><Palette className="size-4" /></ToolbarButton>
          <ToolbarButton label="Sorot teks" active={panel === "highlight"} onClick={(event) => openPanel(event, "highlight")}><Highlighter className="size-4" /></ToolbarButton>
          <ToolbarButton label="Ukuran teks" active={panel === "size"} onClick={(event) => openPanel(event, "size")}><span className="text-[11px] font-bold">Aa</span></ToolbarButton>
          <ToolbarButton label="Hapus format" onClick={clearFormatting}><RemoveFormatting className="size-4" /></ToolbarButton>
          <span className="mx-1 h-5 w-px bg-slate-200" />
          <ToolbarButton label="Tambah tautan" active={panel === "link" || activeFormats.has("link")} onClick={(event) => openPanel(event, "link")}><Link2 className="size-4" /></ToolbarButton>
          <ToolbarButton label="Tambah media" active={panel === "media"} onClick={(event) => openPanel(event, "media")}><ImagePlus className="size-4" /></ToolbarButton>
          <ToolbarButton label="Sematkan video" active={panel === "embed"} onClick={(event) => openPanel(event, "embed")}><Code2 className="size-4" /></ToolbarButton>
          <ToolbarButton label="Sisipkan tabel" active={panel === "table" || activeFormats.has("table-cell")} onClick={(event) => openPanel(event, "table")}><Table2 className="size-4" /></ToolbarButton>
          <ToolbarButton label="Blok kode" active={activeFormats.has("code")} onClick={toggleCodeBlock}><SquareCode className="size-4" /></ToolbarButton>
        </div>

        {activeFormats.has("table-cell") && (
          <div className="flex flex-wrap items-center gap-1 border-t border-slate-100 px-2 py-2">
            <span className="mr-1 px-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Tabel</span>
            <ContextButton label="Tambah baris" onClick={addTableRow}><Rows3 className="size-3.5" /> Baris</ContextButton>
            <ContextButton label="Tambah kolom" onClick={addTableColumn}><Columns3 className="size-3.5" /> Kolom</ContextButton>
            <ContextButton label="Hapus baris" onClick={deleteTableRow}><Trash2 className="size-3.5" /> Baris</ContextButton>
            <ContextButton label="Hapus kolom" onClick={deleteTableColumn}><Trash2 className="size-3.5" /> Kolom</ContextButton>
            <ContextButton label="Hapus tabel" onClick={deleteTable}><Trash2 className="size-3.5" /> Tabel</ContextButton>
          </div>
        )}

        {mediaSelection && (
          <div className="flex flex-wrap items-center gap-1 border-t border-slate-100 px-2 py-2">
            <span className="mr-1 px-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              {mediaSelection.kind} · {mediaSelection.width}% · {mediaLayoutLabel(mediaSelection)}
            </span>
            <ContextButton label="Perkecil media" onClick={() => resizeSelectedMedia(-10)}><Minimize2 className="size-3.5" /> Kecil</ContextButton>
            <ContextButton label="Perbesar media" onClick={() => resizeSelectedMedia(10)}><Maximize2 className="size-3.5" /> Besar</ContextButton>
            {[25, 50, 75, 100].map((width) => (
              <ContextButton key={width} label={`Lebar media ${width}%`} active={mediaSelection.width === width} onClick={() => setMediaWidth(width)}>{width}%</ContextButton>
            ))}
            <span className="mx-1 h-5 w-px bg-slate-200" />
            <ContextButton label="Posisi media rata kiri" active={mediaSelection.float === "none" && mediaSelection.alignment === "left"} onClick={() => setMediaAlignment("left")}><TextAlignStart className="size-3.5" /></ContextButton>
            <ContextButton label="Posisi media rata tengah" active={mediaSelection.float === "none" && mediaSelection.alignment === "center"} onClick={() => setMediaAlignment("center")}><TextAlignCenter className="size-3.5" /></ContextButton>
            <ContextButton label="Posisi media rata kanan" active={mediaSelection.float === "none" && mediaSelection.alignment === "right"} onClick={() => setMediaAlignment("right")}><TextAlignEnd className="size-3.5" /></ContextButton>
            <span className="mx-1 h-5 w-px bg-slate-200" />
            <span className="px-1 text-[10px] font-semibold text-slate-500">Teks di samping</span>
            <ContextButton label="Letakkan gambar di kiri dan alirkan teks di kanan" active={mediaSelection.float === "left"} onClick={() => setMediaFloat("left")}><PanelLeft className="size-3.5" /> Teks kanan</ContextButton>
            <ContextButton label="Letakkan gambar di kanan dan alirkan teks di kiri" active={mediaSelection.float === "right"} onClick={() => setMediaFloat("right")}><PanelRight className="size-3.5" /> Teks kiri</ContextButton>
            {mediaSelection.float !== "none" && (
              <ContextButton label="Hentikan teks mengelilingi media" onClick={() => setMediaFloat("none")}><TextWrap className="size-3.5" /> Lepas</ContextButton>
            )}
            <span className="mx-1 h-5 w-px bg-slate-200" />
            <ContextButton label="Geser posisi media" onPointerDown={startMediaDrag}><Move className="size-3.5" /> Geser</ContextButton>
            <ContextButton label="Pindah media ke atas" onClick={() => moveSelectedMedia("up")}><ChevronUp className="size-3.5" /></ContextButton>
            <ContextButton label="Pindah media ke bawah" onClick={() => moveSelectedMedia("down")}><ChevronDown className="size-3.5" /></ContextButton>
            <ContextButton label="Hapus media" onClick={removeSelectedMedia}><Trash2 className="size-3.5" /> Hapus</ContextButton>
          </div>
        )}
      </div>

      {panel && (
        <div className="border-b border-slate-100 bg-white p-3">
          {panel === "link" && (
            <div className="space-y-2">
              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                <input aria-label="Alamat tautan" type="text" value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} placeholder="https://contoh.id/berita atau /halaman" className="h-9 rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-violet-400" />
                <input aria-label="Teks tautan jika belum memilih teks" value={linkLabel} onChange={(event) => setLinkLabel(event.target.value)} placeholder="Teks tautan (opsional)" className="h-9 rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-violet-400" />
                <PanelButton onClick={insertLink}><Link2 className="size-3.5" /> Sisipkan</PanelButton>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
                <label className="inline-flex items-center gap-1.5">
                  <input type="checkbox" checked={linkNewTab} onChange={(event) => setLinkNewTab(event.target.checked)} className="size-3.5 accent-violet-700" />
                  Buka di tab baru
                </label>
                <button type="button" onClick={removeLink} className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-700">
                  <Unlink className="size-3.5" /> Hapus tautan
                </button>
              </div>
            </div>
          )}

          {panel === "media" && (
            <div className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="block text-[11px] font-medium text-slate-600">Teks alternatif gambar<input value={mediaAlt} onChange={(event) => setMediaAlt(event.target.value)} maxLength={255} placeholder="Jelaskan isi gambar" className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-violet-400" /></label>
                <label className="block text-[11px] font-medium text-slate-600">Keterangan media (opsional)<input value={mediaCaption} onChange={(event) => setMediaCaption(event.target.value)} maxLength={500} placeholder="Keterangan yang tampil di bawah media" className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-violet-400" /></label>
              </div>

              <div className="flex flex-wrap gap-1">
                {libraryFilters.map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    aria-pressed={mediaFilter === filter.value}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => setMediaFilter(filter.value)}
                    className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${mediaFilter === filter.value ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-500 hover:text-slate-700"}`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {filteredLibrary.length ? (
                <div className="grid max-h-56 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
                  {filteredLibrary.map((entry) => (
                    <button
                      key={entry.record.id}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => insertLibraryMedia(entry)}
                      className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 p-2 text-left hover:border-violet-300 hover:bg-violet-50"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded bg-slate-100 text-slate-500">
                        {entry.kind === "image" ? (
                          <Image src={entry.record.slug} alt="" width={40} height={40} unoptimized className="size-10 object-cover" />
                        ) : entry.kind === "video" ? (
                          <Film className="size-4" />
                        ) : entry.kind === "audio" ? (
                          <Music className="size-4" />
                        ) : (
                          <FileText className="size-4" />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[10px] font-medium text-slate-700">{entry.record.title}</span>
                        <span className="block text-[9px] font-medium uppercase tracking-wide text-slate-400">{entry.extension}</span>
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="border-t border-slate-100 pt-3 text-xs text-slate-500">
                  {libraryItems.length ? "Tidak ada media pada filter ini." : "Pustaka media belum memiliki file yang bisa disisipkan."}
                </p>
              )}

              {canUploadMedia ? (
                <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                  <input ref={uploadRef} type="file" accept={mediaAccept} onChange={handleMediaUpload} className="sr-only" />
                  <PanelButton disabled={uploading} onClick={() => uploadRef.current?.click()}><Upload className="size-3.5" />{uploading ? "Mengunggah..." : "Unggah & sisipkan media"}</PanelButton>
                  <span className="text-[10px] text-slate-400">{mediaUploadHint}</span>
                </div>
              ) : <p className="border-t border-slate-100 pt-3 text-[10px] text-slate-500">Pilih media dari pustaka. Izin mengunggah media tidak tersedia untuk akun ini.</p>}
            </div>
          )}

          {panel === "embed" && (
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <input aria-label="Tautan video YouTube atau Vimeo" type="url" value={embedUrl} onChange={(event) => setEmbedUrl(event.target.value)} placeholder="Tempel tautan YouTube atau Vimeo" className="h-9 rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-violet-400" />
              <PanelButton onClick={insertEmbed}><Code2 className="size-3.5" /> Sematkan video</PanelButton>
            </div>
          )}

          {panel === "table" && (
            <div className="flex flex-wrap items-end gap-2">
              <label className="block text-[11px] font-medium text-slate-600">Baris<input aria-label="Jumlah baris tabel" type="number" min={1} max={tableLimits.rows} value={tableRows} onChange={(event) => setTableRows(Number(event.target.value))} className="mt-1 h-9 w-20 rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-violet-400" /></label>
              <label className="block text-[11px] font-medium text-slate-600">Kolom<input aria-label="Jumlah kolom tabel" type="number" min={1} max={tableLimits.columns} value={tableColumns} onChange={(event) => setTableColumns(Number(event.target.value))} className="mt-1 h-9 w-20 rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-violet-400" /></label>
              <label className="inline-flex h-9 items-center gap-1.5 text-[11px] font-medium text-slate-600">
                <input type="checkbox" checked={tableHeader} onChange={(event) => setTableHeader(event.target.checked)} className="size-3.5 accent-violet-700" />
                Baris judul
              </label>
              <PanelButton onClick={insertTable}><Table2 className="size-3.5" /> Sisipkan tabel</PanelButton>
              <p className="w-full text-[10px] text-slate-400">Setelah tabel dibuat, gunakan baris Tabel pada toolbar untuk menambah atau menghapus baris dan kolom.</p>
            </div>
          )}

          {panel === "color" && (
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-slate-600">Warna teks</p>
              <div className="flex flex-wrap gap-2">
                {textColors.map((color) => (
                  <button key={color.value} type="button" aria-label={`Warna ${color.label}`} title={color.label} onMouseDown={(event) => event.preventDefault()} onClick={() => applyInlineStyle("color", color.value)} style={{ backgroundColor: color.value }} className="size-7 rounded-full border border-slate-300 shadow-sm ring-offset-2 hover:ring-2 hover:ring-violet-300" />
                ))}
                <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => resetInlineStyle("color")} className="h-7 rounded-full border border-slate-200 px-3 text-[10px] font-semibold text-slate-600 hover:border-violet-300">Bawaan</button>
              </div>
            </div>
          )}

          {panel === "highlight" && (
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-slate-600">Sorotan teks</p>
              <div className="flex flex-wrap gap-2">
                {highlightColors.map((color) => (
                  <button key={color.value} type="button" aria-label={`Sorot ${color.label}`} title={color.label} onMouseDown={(event) => event.preventDefault()} onClick={() => applyInlineStyle("background-color", color.value)} style={{ backgroundColor: color.value }} className="size-7 rounded-md border border-slate-300 shadow-sm ring-offset-2 hover:ring-2 hover:ring-violet-300" />
                ))}
                <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => resetInlineStyle("background-color")} className="h-7 rounded-md border border-slate-200 px-3 text-[10px] font-semibold text-slate-600 hover:border-violet-300">Hapus sorotan</button>
              </div>
            </div>
          )}

          {panel === "size" && (
            <div className="flex flex-wrap items-center gap-2">
              <p className="mr-1 text-[11px] font-medium text-slate-600">Ukuran teks</p>
              {fontSizes.map((size) => (
                <button key={size.value} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => applyInlineStyle("font-size", size.value)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-700 hover:border-violet-300 hover:bg-violet-50" style={{ fontSize: size.value }}>{size.label}</button>
              ))}
              <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => resetInlineStyle("font-size")} className="rounded-lg border border-slate-200 px-3 py-1.5 text-[10px] font-semibold text-slate-600 hover:border-violet-300">Bawaan</button>
            </div>
          )}
        </div>
      )}
      {error && <p role="alert" className="border-b border-rose-100 bg-rose-50 px-4 py-2 text-xs text-rose-700">{error}</p>}

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label="Isi berita"
        aria-multiline="true"
        aria-required={required}
        data-empty={editorEmpty}
        data-placeholder="Mulai tulis berita. Tambahkan gambar, video, audio, atau dokumen dari toolbar."
        onInput={publishChange}
        onClick={handleEditorClick}
        onKeyUp={rememberSelection}
        onKeyDown={handleKeyDown}
        onMouseUp={rememberSelection}
        onFocus={refreshActiveFormats}
        onBlur={publishChange}
        onPaste={(event) => {
          event.preventDefault()
          const text = event.clipboardData.getData("text/plain")
          if (text) insertPlainText(text)
        }}
        onDragOver={(event) => {
          if (event.dataTransfer.types.includes("Files")) event.preventDefault()
        }}
        onDrop={(event) => {
          event.preventDefault()
          const file = event.dataTransfer.files?.[0]
          if (file) void uploadMediaFile(file)
        }}
        className="cms-rich-text relative min-h-[360px] px-5 py-4 text-sm leading-7 text-slate-800 outline-none [&_a]:text-violet-700 [&_a]:underline [&_audio]:my-4 [&_audio]:w-full [&_blockquote]:border-l-2 [&_blockquote]:border-violet-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_figcaption]:mt-2 [&_figcaption]:text-center [&_figcaption]:text-xs [&_figcaption]:text-slate-500 [&_figure]:my-5 [&_h2]:my-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:my-2.5 [&_h3]:text-lg [&_h3]:font-semibold [&_iframe]:aspect-video [&_iframe]:w-full [&_iframe]:rounded-lg [&_img]:mx-auto [&_img]:max-h-[560px] [&_img]:rounded-lg [&_img]:object-contain [&_li]:ml-5 [&_li]:list-disc [&_ol>li]:list-decimal [&_p]:my-2 [&_video]:my-4 [&_video]:max-h-[560px] [&_video]:w-full [&_video]:rounded-lg [&_video]:bg-black data-[empty=true]:before:pointer-events-none data-[empty=true]:before:absolute data-[empty=true]:before:top-4 data-[empty=true]:before:left-5 data-[empty=true]:before:text-slate-400 data-[empty=true]:before:content-[attr(data-placeholder)]"
      />
      {mediaOverlay && mediaSelection && (
        <div className="pointer-events-none absolute z-10 rounded-lg ring-2 ring-violet-500" style={{ left: mediaOverlay.left, top: mediaOverlay.top, width: mediaOverlay.width, height: mediaOverlay.height }}>
          <span className="absolute left-2 top-2 rounded bg-violet-700 px-1.5 py-0.5 text-[9px] font-semibold text-white shadow">{mediaSelection.kind} · {mediaSelection.width}% · {mediaLayoutLabel(mediaSelection)}</span>
          <div className="pointer-events-auto absolute -top-9 right-0 flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5 shadow-md">
            <button type="button" aria-label="Perkecil media" title="Perkecil media" onMouseDown={(event) => event.preventDefault()} onClick={() => resizeSelectedMedia(-10)} className="flex size-7 items-center justify-center rounded-md text-slate-600 hover:bg-violet-50 hover:text-violet-700"><Minus className="size-3.5" /></button>
            <button type="button" aria-label="Perbesar media" title="Perbesar media" onMouseDown={(event) => event.preventDefault()} onClick={() => resizeSelectedMedia(10)} className="flex size-7 items-center justify-center rounded-md text-slate-600 hover:bg-violet-50 hover:text-violet-700"><Plus className="size-3.5" /></button>
            <button type="button" aria-label="Geser posisi media" title="Geser posisi media" onMouseDown={(event) => event.preventDefault()} onPointerDown={startMediaDrag} className="flex size-7 items-center justify-center rounded-md text-slate-600 hover:bg-violet-50 hover:text-violet-700"><Move className="size-3.5" /></button>
            <button type="button" aria-label="Hapus media dari isi berita" title="Hapus media dari isi berita" onMouseDown={(event) => event.preventDefault()} onClick={removeSelectedMedia} className="flex size-7 items-center justify-center rounded-md text-slate-600 hover:bg-rose-50 hover:text-rose-700"><Trash2 className="size-3.5" /></button>
          </div>
          <button
            type="button"
            aria-label="Tarik untuk mengubah ukuran media"
            title="Tarik untuk mengubah ukuran media"
            onPointerDown={startMediaResize}
            className="pointer-events-auto absolute bottom-1 right-1 flex size-6 cursor-nwse-resize items-center justify-center rounded-md bg-violet-700 text-white shadow-md hover:bg-violet-800"
          >
            <Maximize2 className="size-3.5" />
          </button>
        </div>
      )}
      <input
        aria-label="Validasi isi berita"
        aria-hidden="true"
        tabIndex={-1}
        required={required}
        value={hasRichTextContent(value) ? "terisi" : ""}
        onChange={() => undefined}
        onInvalid={(event) => {
          event.preventDefault()
          setError("Isi berita wajib diisi.")
          editorRef.current?.focus()
        }}
        className="pointer-events-none absolute h-px w-px opacity-0"
      />
      <div className="border-t border-slate-100 px-4 py-2 text-[10px] text-slate-400">HTML disaring di browser dan server. Media hanya dari pustaka; embed dibatasi ke YouTube dan Vimeo.</div>
    </div>
  )
}

function ToolbarButton({ children, label, active, onClick }: { children: React.ReactNode; label: string; active?: boolean; onClick: (event: MouseEvent<HTMLButtonElement>) => void }) {
  return <button type="button" aria-label={label} title={label} aria-pressed={active} onMouseDown={(event) => event.preventDefault()} onClick={onClick} className={`rounded-md p-2 ${active ? "bg-violet-100 text-violet-700" : "text-slate-600 hover:bg-white hover:text-violet-700"}`}>{children}</button>
}

function PanelButton({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return <button type="button" disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={onClick} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-violet-700 px-3 text-xs font-semibold text-white hover:bg-violet-800 disabled:cursor-wait disabled:opacity-60">{children}</button>
}

function ContextButton({ children, label, onClick, onPointerDown, active }: { children: React.ReactNode; label: string; onClick?: () => void; onPointerDown?: (event: ReactPointerEvent<HTMLButtonElement>) => void; active?: boolean }) {
  return <button type="button" aria-label={label} title={label} aria-pressed={active} onMouseDown={(event) => event.preventDefault()} onPointerDown={onPointerDown} onClick={onClick} className={`inline-flex h-8 items-center gap-1 rounded-md px-2 text-[10px] font-semibold ${active ? "bg-violet-100 text-violet-700" : "text-slate-600 hover:bg-white hover:text-violet-700"}`}>{children}</button>
}
