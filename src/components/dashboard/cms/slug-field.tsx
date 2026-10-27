"use client"

import { useEffect, useId, useState } from "react"
import { Wand2 } from "lucide-react"
import { inputClassName } from "@/components/dashboard/cms/presentation"
import { cmsSlugify } from "@/lib/cms/slug"

export function CmsSlugField({
  label = "Slug",
  value,
  sourceValue,
  sourceLabel = "judul",
  onChange,
  placeholder,
  disabled = false,
  readOnly = false,
  maxLength = 180,
  helperText,
}: {
  label?: string
  value: string
  sourceValue: string
  sourceLabel?: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  readOnly?: boolean
  maxLength?: number
  helperText?: string
}) {
  const inputId = useId()
  const [auto, setAuto] = useState(() => !value)

  useEffect(() => {
    if (!auto) return
    const next = sourceValue.trim() ? cmsSlugify(sourceValue) : ""
    if (next !== value) onChange(next)
  }, [auto, onChange, sourceValue, value])

  function generate() {
    setAuto(true)
    onChange(sourceValue.trim() ? cmsSlugify(sourceValue) : "")
  }

  return (
    <div>
      <label htmlFor={inputId} className="block text-xs font-medium text-slate-700">{label}</label>
      <div className="flex gap-2">
        <input
          id={inputId}
          value={value}
          readOnly={readOnly}
          disabled={disabled}
          maxLength={maxLength}
          placeholder={placeholder || `Otomatis dari ${sourceLabel.toLowerCase()}`}
          onChange={(event) => {
            setAuto(false)
            onChange(event.target.value)
          }}
          className={`${inputClassName()} min-w-0 flex-1 font-mono`}
        />
        <button
          type="button"
          onClick={generate}
          disabled={disabled || readOnly || !sourceValue.trim()}
          className="mt-1.5 inline-flex h-[42px] shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Wand2 className="size-3.5" />
          Generate
        </button>
      </div>
      <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
        {helperText || (auto
          ? `Slug dibuat otomatis dari ${sourceLabel.toLowerCase()}. Klik Generate untuk memperbarui.`
          : "Slug manual. Kosongkan untuk dibuat otomatis dari " + sourceLabel.toLowerCase() + " saat disimpan.")}
      </p>
    </div>
  )
}
