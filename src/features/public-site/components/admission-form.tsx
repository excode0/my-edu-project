"use client"

import { useState, type FormEvent } from "react"

export type AdmissionField = {
  key: string
  label: string
  field_type: string
  is_required: boolean
  options: unknown
  help_text: string | null
}

export function AdmissionForm({ fields }: { fields: AdmissionField[] }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [reference, setReference] = useState("")

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    setBusy(true)
    setError("")
    setReference("")

    const formData = new FormData(form)
    const data = Object.fromEntries(fields.map((field) => [
      field.key,
      field.field_type === "boolean"
        ? String(formData.has(field.key))
        : field.field_type === "multiselect"
          ? formData.getAll(field.key).map(String)
        : String(formData.get(field.key) ?? ""),
    ]))

    try {
      const response = await fetch("/api/public/admissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data,
          privacyConsent: formData.get("privacyConsent") === "on",
          website: String(formData.get("website") ?? ""),
        }),
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(typeof result.error === "string" ? result.error : "Pendaftaran belum dapat dikirim.")
      }
      setReference(result.referenceCode)
      form.reset()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Terjadi kesalahan saat mengirim pendaftaran.")
    } finally {
      setBusy(false)
    }
  }

  if (!fields.length) {
    return <p className="mt-4 text-sm text-violet-100">Formulir pendaftaran belum tersedia. Silakan hubungi sekolah.</p>
  }

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-2xl bg-white p-5 text-slate-900 sm:p-6">
      {fields.map((field) => {
        const inputTypes: Record<string, string> = {
          email: "email",
          phone: "tel",
          date: "date",
          datetime: "datetime-local",
          url: "url",
          number: "number",
        }
        const inputType = inputTypes[field.field_type] ?? "text"
        const commonProps = {
          id: `admission-${field.key}`,
          name: field.key,
          required: field.is_required,
          maxLength: 2000,
          className: field.field_type === "boolean"
            ? "mt-2 size-4 accent-violet-700"
            : "mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100",
        }

        return (
          <label key={field.key} htmlFor={commonProps.id} className="text-sm font-medium text-slate-700">
            {field.label}{field.is_required ? " *" : ""}
            {field.field_type === "textarea" || field.field_type === "richtext" ? (
              <textarea {...commonProps} rows={3} />
            ) : (field.field_type === "select" || field.field_type === "multiselect") && Array.isArray(field.options) ? (
              <select
                {...commonProps}
                multiple={field.field_type === "multiselect"}
                defaultValue={field.field_type === "multiselect" ? [] : ""}
              >
                {field.field_type === "select" && <option value="" disabled>Pilih {field.label.toLowerCase()}</option>}
                {field.options.map((option) => (
                  <option key={String(option)} value={String(option)}>{String(option)}</option>
                ))}
              </select>
            ) : field.field_type === "boolean" ? (
              <input {...commonProps} type="checkbox" value="true" />
            ) : (
              <input {...commonProps} type={inputType} />
            )}
            {field.help_text && <span className="mt-1 block text-xs font-normal text-slate-500">{field.help_text}</span>}
          </label>
        )
      })}

      <label className="flex items-start gap-2 text-xs leading-5 text-slate-600">
        <input name="privacyConsent" type="checkbox" required className="mt-1 accent-violet-700" />
        Saya menyetujui data pendaftaran digunakan sekolah untuk proses penerimaan siswa baru.
      </label>
      <label aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>

      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {reference && (
        <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
          Pendaftaran berhasil dikirim. Simpan nomor referensi <strong>{reference}</strong>.
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-violet-700 px-5 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:cursor-wait disabled:opacity-60"
      >
        {busy ? "Mengirim..." : "Kirim pendaftaran"}
      </button>
    </form>
  )
}
