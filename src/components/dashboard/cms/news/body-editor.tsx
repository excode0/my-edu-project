"use client"

import { Bold, Heading2, Italic, Quote } from "lucide-react"
import { useEffect, useRef } from "react"
import { sanitizeCmsEditorHtml } from "./sanitize-editor-html"

export function CmsNewsBodyEditor({ value, required, onChange }: { value: string; required: boolean; onChange: (value: string) => void }) {
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const editor = editorRef.current
    if (editor && document.activeElement !== editor && editor.innerHTML !== value) {
      editor.innerHTML = sanitizeCmsEditorHtml(value)
    }
  }, [value])

  function formatSelection(tag: "strong" | "em" | "h2" | "blockquote") {
    const editor = editorRef.current
    const selection = window.getSelection()
    if (!editor || !selection) return

    editor.focus()
    const range = selection.rangeCount ? selection.getRangeAt(0) : document.createRange()
    if (!editor.contains(range.commonAncestorContainer)) {
      range.selectNodeContents(editor)
      range.collapse(false)
    }

    if (tag === "h2" || tag === "blockquote") {
      const anchor = range.commonAncestorContainer instanceof Element
        ? range.commonAncestorContainer
        : range.commonAncestorContainer.parentElement
      const block = anchor?.closest("p, div, h2, h3, blockquote")
      if (block && editor.contains(block)) {
        const wrapper = document.createElement(tag)
        wrapper.append(...Array.from(block.childNodes))
        block.replaceWith(wrapper)
        const nextRange = document.createRange()
        nextRange.selectNodeContents(wrapper)
        selection.removeAllRanges()
        selection.addRange(nextRange)
        onChange(sanitizeCmsEditorHtml(editor.innerHTML))
        return
      }
    }

    const wrapper = document.createElement(tag)
    const contents = range.extractContents()
    if (contents.childNodes.length) wrapper.append(contents)
    else wrapper.append(document.createElement("br"))
    range.insertNode(wrapper)
    selection.removeAllRanges()
    const nextRange = document.createRange()
    nextRange.selectNodeContents(wrapper)
    selection.addRange(nextRange)
    onChange(sanitizeCmsEditorHtml(editor.innerHTML))
  }

  function handleInput() {
    const editor = editorRef.current
    if (editor) onChange(sanitizeCmsEditorHtml(editor.innerHTML))
  }

  function handlePaste(event: React.ClipboardEvent<HTMLDivElement>) {
    event.preventDefault()
    const text = event.clipboardData.getData("text/plain")
    const selection = window.getSelection()
    if (!selection?.rangeCount) return
    const range = selection.getRangeAt(0)
    range.deleteContents()
    const textNode = document.createTextNode(text)
    range.insertNode(textNode)
    range.setStartAfter(textNode)
    range.collapse(true)
    selection.removeAllRanges()
    selection.addRange(range)
    handleInput()
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100">
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-100 bg-slate-50 px-2 py-2">
        <span className="mr-2 px-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Format</span>
        <button type="button" aria-label="Tebalkan" title="Tebalkan" onMouseDown={(event) => event.preventDefault()} onClick={() => formatSelection("strong")} className="rounded-md p-2 text-slate-600 hover:bg-white hover:text-violet-700"><Bold className="size-4" /></button>
        <button type="button" aria-label="Miring" title="Miring" onMouseDown={(event) => event.preventDefault()} onClick={() => formatSelection("em")} className="rounded-md p-2 text-slate-600 hover:bg-white hover:text-violet-700"><Italic className="size-4" /></button>
        <button type="button" aria-label="Subjudul" title="Subjudul" onMouseDown={(event) => event.preventDefault()} onClick={() => formatSelection("h2")} className="rounded-md p-2 text-slate-600 hover:bg-white hover:text-violet-700"><Heading2 className="size-4" /></button>
        <button type="button" aria-label="Kutipan" title="Kutipan" onMouseDown={(event) => event.preventDefault()} onClick={() => formatSelection("blockquote")} className="rounded-md p-2 text-slate-600 hover:bg-white hover:text-violet-700"><Quote className="size-4" /></button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label="Isi berita"
        aria-multiline="true"
        aria-required={required}
        onInput={handleInput}
        onPaste={handlePaste}
        onBlur={handleInput}
        className="min-h-[360px] px-5 py-4 text-sm leading-7 text-slate-800 outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 [&_blockquote]:border-l-2 [&_blockquote]:border-violet-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_h2]:my-3 [&_h2]:text-xl [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_ol>li]:list-decimal [&_p]:my-2"
        data-placeholder="Mulai tulis berita di sini. Gunakan toolbar untuk menyusun judul dan penekanan..."
      />
      <div className="border-t border-slate-100 px-4 py-2 text-[10px] text-slate-400">Konten diformat langsung di editor. HTML disaring sebelum disimpan.</div>
    </div>
  )
}
