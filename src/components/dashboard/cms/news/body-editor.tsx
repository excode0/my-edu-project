"use client"

import { useEffect, useRef, useState, type ChangeEvent, type MouseEvent } from "react"
import { Bold, Code2, Heading2, ImagePlus, Italic, Link2, List, ListOrdered, Quote, Upload } from "lucide-react"
import Image from "next/image"
import { isCmsImageSource, normalizeCmsEmbedUrl, normalizeCmsLinkHref } from "@/lib/cms/richtext-policy"
import type { CmsRecord } from "@/types/type-cms-api"
import { uploadCmsMedia } from "@/lib/cms/client/media-api"
import { sanitizeCmsEditorHtml } from "./sanitize-editor-html"

type InsertPanel = "link" | "image" | "embed" | null

function hasRichTextContent(value: string) {
  const text = value.replace(/<br\s*\/?>/gi, "").replace(/<[^>]*>/g, "").replace(/&nbsp;|&#160;/gi, " ").trim()
  return Boolean(text || /<(?:img|iframe)\b/i.test(value))
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
  const editorRef = useRef<HTMLDivElement>(null)
  const uploadRef = useRef<HTMLInputElement>(null)
  const savedRangeRef = useRef<Range | null>(null)
  const [panel, setPanel] = useState<InsertPanel>(null)
  const [linkUrl, setLinkUrl] = useState("")
  const [linkLabel, setLinkLabel] = useState("")
  const [embedUrl, setEmbedUrl] = useState("")
  const [imageAlt, setImageAlt] = useState("")
  const [imageCaption, setImageCaption] = useState("")
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const imageMedia = media.filter((item) => isCmsImageSource(item.slug))

  useEffect(() => {
    const editor = editorRef.current
    if (editor && document.activeElement !== editor && editor.innerHTML !== value) {
      editor.innerHTML = sanitizeCmsEditorHtml(value)
    }
  }, [value])

  function rememberSelection() {
    const editor = editorRef.current
    const selection = window.getSelection()
    if (editor && selection?.rangeCount && editor.contains(selection.anchorNode)) {
      savedRangeRef.current = selection.getRangeAt(0).cloneRange()
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

  function finishInsertion(range: Range) {
    const editor = editorRef.current
    if (!editor) return
    const selection = window.getSelection()
    range.collapse(false)
    selection?.removeAllRanges()
    selection?.addRange(range)
    savedRangeRef.current = range.cloneRange()
    editor.focus()
    publishChange()
  }

  function publishChange() {
    const editor = editorRef.current
    if (editor) onChange(sanitizeCmsEditorHtml(editor.innerHTML))
  }

  function insertNode(node: Node) {
    const range = getEditorRange()
    if (!range) return
    range.deleteContents()
    range.insertNode(node)
    range.setStartAfter(node)
    finishInsertion(range)
  }

  function insertImage(src: string, alt: string, caption = imageCaption) {
    const figure = document.createElement("figure")
    const image = document.createElement("img")
    image.src = src
    image.alt = alt.trim().slice(0, 255)
    image.loading = "lazy"
    figure.append(image)
    if (caption.trim()) {
      const captionElement = document.createElement("figcaption")
      captionElement.textContent = caption.trim()
      figure.append(captionElement)
    }
    insertNode(figure)
    setPanel(null)
    setError("")
    setImageCaption("")
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
    insertNode(figure)
    setEmbedUrl("")
    setPanel(null)
    setError("")
  }

  function insertLink() {
    const href = normalizeCmsLinkHref(linkUrl)
    if (!href) {
      setError("Tautan harus memakai http, https, mailto, atau alamat internal yang diawali /.")
      return
    }
    const range = getEditorRange()
    if (!range) return
    const anchor = document.createElement("a")
    anchor.href = href
    anchor.rel = "noopener noreferrer"
    if (range.collapsed) anchor.textContent = linkLabel.trim() || href
    else anchor.append(range.extractContents())
    range.deleteContents()
    range.insertNode(anchor)
    range.setStartAfter(anchor)
    finishInsertion(range)
    setLinkUrl("")
    setLinkLabel("")
    setPanel(null)
    setError("")
  }

  function formatSelection(tag: "strong" | "em" | "h2" | "blockquote" | "ul" | "ol") {
    const editor = editorRef.current
    const range = getEditorRange()
    if (!editor || !range) return
    const selection = window.getSelection()
    const anchorNode = range.commonAncestorContainer
    const anchor = anchorNode instanceof Element ? anchorNode : anchorNode.parentElement
    const block = anchor?.closest("p, div, h2, h3, blockquote")

    if (tag === "ul" || tag === "ol") {
      const list = document.createElement(tag)
      const item = document.createElement("li")
      if (block && editor.contains(block)) {
        item.append(...Array.from(block.childNodes))
        block.replaceWith(list)
      } else {
        item.append(range.extractContents())
        range.deleteContents()
        range.insertNode(list)
      }
      list.append(item)
      const nextRange = document.createRange()
      nextRange.selectNodeContents(item)
      nextRange.collapse(false)
      if (selection) {
        selection.removeAllRanges()
        selection.addRange(nextRange)
      }
      finishInsertion(nextRange)
      return
    }

    if ((tag === "h2" || tag === "blockquote") && block && editor.contains(block)) {
      const wrapper = document.createElement(tag)
      wrapper.append(...Array.from(block.childNodes))
      block.replaceWith(wrapper)
      const nextRange = document.createRange()
      nextRange.selectNodeContents(wrapper)
      nextRange.collapse(false)
      if (selection) {
        selection.removeAllRanges()
        selection.addRange(nextRange)
      }
      finishInsertion(nextRange)
      return
    }

    const wrapper = document.createElement(tag)
    const contents = range.extractContents()
    if (contents.childNodes.length) wrapper.append(contents)
    else wrapper.append(document.createElement("br"))
    range.insertNode(wrapper)
    range.selectNodeContents(wrapper)
    range.collapse(false)
    finishInsertion(range)
  }

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ""
    if (!file) return
    setUploading(true)
    setError("")
    try {
      const form = new FormData()
      form.set("file", file)
      form.set("title", file.name)
      form.set("altText", imageAlt)
      const uploaded = await uploadCmsMedia(form)
      insertImage(uploaded.publicUrl, imageAlt || file.name.replace(/\.[^.]+$/, ""), imageCaption)
      try {
        await onUploaded()
      } catch {
        setError("Gambar berhasil diunggah dan disisipkan, tetapi pustaka media gagal diperbarui.")
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Gambar tidak dapat diunggah.")
    } finally {
      setUploading(false)
    }
  }

  function openPanel(event: MouseEvent<HTMLButtonElement>, nextPanel: Exclude<InsertPanel, null>) {
    event.preventDefault()
    rememberSelection()
    setError("")
    setPanel((current) => current === nextPanel ? null : nextPanel)
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100">
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-100 bg-slate-50 px-2 py-2">
        <span className="mr-2 px-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Format</span>
        <ToolbarButton label="Tebalkan" onClick={() => formatSelection("strong")}><Bold className="size-4" /></ToolbarButton>
        <ToolbarButton label="Miring" onClick={() => formatSelection("em")}><Italic className="size-4" /></ToolbarButton>
        <ToolbarButton label="Subjudul" onClick={() => formatSelection("h2")}><Heading2 className="size-4" /></ToolbarButton>
        <ToolbarButton label="Kutipan" onClick={() => formatSelection("blockquote")}><Quote className="size-4" /></ToolbarButton>
        <ToolbarButton label="Daftar berpoin" onClick={() => formatSelection("ul")}><List className="size-4" /></ToolbarButton>
        <ToolbarButton label="Daftar bernomor" onClick={() => formatSelection("ol")}><ListOrdered className="size-4" /></ToolbarButton>
        <span className="mx-1 h-5 w-px bg-slate-200" />
        <ToolbarButton label="Tambah tautan" active={panel === "link"} onClick={(event) => openPanel(event, "link")}><Link2 className="size-4" /></ToolbarButton>
        <ToolbarButton label="Tambah gambar" active={panel === "image"} onClick={(event) => openPanel(event, "image")}><ImagePlus className="size-4" /></ToolbarButton>
        <ToolbarButton label="Sematkan video" active={panel === "embed"} onClick={(event) => openPanel(event, "embed")}><Code2 className="size-4" /></ToolbarButton>
      </div>

      {panel && (
        <div className="border-b border-slate-100 bg-white p-3">
          {panel === "link" && (
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
              <input aria-label="Alamat tautan" type="text" value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} placeholder="https://contoh.id/berita atau /halaman" className="h-9 rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-violet-400" />
              <input aria-label="Teks tautan jika belum memilih teks" value={linkLabel} onChange={(event) => setLinkLabel(event.target.value)} placeholder="Teks tautan (opsional)" className="h-9 rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-violet-400" />
              <PanelButton onClick={insertLink}><Link2 className="size-3.5" /> Sisipkan</PanelButton>
            </div>
          )}
          {panel === "image" && (
            <div className="space-y-3">
              <label className="block text-[11px] font-medium text-slate-600">Teks alternatif<input value={imageAlt} onChange={(event) => setImageAlt(event.target.value)} maxLength={255} placeholder="Jelaskan isi gambar" className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-violet-400" /></label>
              <label className="block text-[11px] font-medium text-slate-600">Keterangan gambar (opsional)<input value={imageCaption} onChange={(event) => setImageCaption(event.target.value)} maxLength={500} placeholder="Keterangan yang tampil di bawah gambar" className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-violet-400" /></label>
              {imageMedia.length ? (
                <div className="grid max-h-52 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
                  {imageMedia.map((item) => (
                    <button key={item.id} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => insertImage(item.slug, imageAlt || item.title)} className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 p-2 text-left hover:border-violet-300 hover:bg-violet-50">
                      <Image src={item.slug} alt="" width={40} height={40} unoptimized className="size-10 shrink-0 rounded object-cover" />
                      <span className="truncate text-[10px] font-medium text-slate-700">{item.title}</span>
                    </button>
                  ))}
                </div>
              ) : <p className="text-xs text-slate-500">Pustaka media belum memiliki gambar.</p>}
              {canUploadMedia ? (
                <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                  <input ref={uploadRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageUpload} className="sr-only" />
                  <PanelButton disabled={uploading} onClick={() => uploadRef.current?.click()}><Upload className="size-3.5" />{uploading ? "Mengunggah…" : "Unggah & sisipkan gambar"}</PanelButton>
                  <span className="text-[10px] text-slate-400">PNG, JPEG, WebP · maks. 5 MB</span>
                </div>
              ) : <p className="border-t border-slate-100 pt-3 text-[10px] text-slate-500">Pilih gambar dari pustaka. Izin mengunggah media tidak tersedia untuk akun ini.</p>}
            </div>
          )}
          {panel === "embed" && (
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <input aria-label="Tautan video YouTube atau Vimeo" type="url" value={embedUrl} onChange={(event) => setEmbedUrl(event.target.value)} placeholder="Tempel tautan YouTube atau Vimeo" className="h-9 rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-violet-400" />
              <PanelButton onClick={insertEmbed}><Code2 className="size-3.5" /> Sematkan video</PanelButton>
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
        onInput={publishChange}
        onKeyUp={rememberSelection}
        onMouseUp={rememberSelection}
        onPaste={(event) => {
          event.preventDefault()
          const text = event.clipboardData.getData("text/plain")
          insertNode(document.createTextNode(text))
        }}
        onBlur={publishChange}
        className="min-h-[360px] px-5 py-4 text-sm leading-7 text-slate-800 outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 [&_blockquote]:border-l-2 [&_blockquote]:border-violet-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_figure]:my-5 [&_figcaption]:mt-2 [&_figcaption]:text-center [&_figcaption]:text-xs [&_figcaption]:text-slate-500 [&_h2]:my-3 [&_h2]:text-xl [&_h2]:font-semibold [&_iframe]:aspect-video [&_iframe]:w-full [&_iframe]:rounded-lg [&_img]:mx-auto [&_img]:max-h-[560px] [&_img]:rounded-lg [&_img]:object-contain [&_li]:ml-5 [&_li]:list-disc [&_ol>li]:list-decimal [&_p]:my-2"
        data-placeholder="Mulai tulis berita. Anda bisa menambahkan gambar, tautan, atau video dari toolbar."
      />
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
      <div className="border-t border-slate-100 px-4 py-2 text-[10px] text-slate-400">HTML disaring di browser dan server. Gambar hanya dari pustaka media; embed dibatasi ke YouTube dan Vimeo.</div>
    </div>
  )
}

function ToolbarButton({ children, label, active, onClick }: { children: React.ReactNode; label: string; active?: boolean; onClick: (event: MouseEvent<HTMLButtonElement>) => void }) {
  return <button type="button" aria-label={label} title={label} aria-pressed={active} onMouseDown={(event) => event.preventDefault()} onClick={onClick} className={`rounded-md p-2 ${active ? "bg-violet-100 text-violet-700" : "text-slate-600 hover:bg-white hover:text-violet-700"}`}>{children}</button>
}

function PanelButton({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return <button type="button" disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={onClick} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-violet-700 px-3 text-xs font-semibold text-white hover:bg-violet-800 disabled:cursor-wait disabled:opacity-60">{children}</button>
}
