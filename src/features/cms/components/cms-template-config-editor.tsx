import { inputClassName } from "../lib/format"
import type { TemplateConfigDraft, TemplateEditorConfig, TemplateSlotDraft } from "../types"

const bindingStatusLabel: Record<string, string> = {
  ok: "Terhubung",
  unmapped: "Belum dipetakan (opsional)",
  missing_field: "Field tidak ditemukan",
  type_mismatch: "Tipe field tidak cocok",
  required_empty: "Nilai wajib belum diisi",
}

export function CmsTemplateConfigEditor({
  template,
  config,
  onChangeVariant,
  onChangeSlot,
}: {
  template: TemplateEditorConfig | undefined
  config: TemplateConfigDraft
  onChangeVariant: (variant: string) => void
  onChangeSlot: (slotKey: string, value: TemplateSlotDraft) => void
}) {
  if (!template) {
    return <p role="alert" className="md:col-span-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-800">Konfigurasi default template tidak tersedia.</p>
  }

  return (
    <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-xs font-medium text-slate-700">Varian tampilan
          <select
            value={config.variant}
            onChange={(event) => onChangeVariant(event.target.value)}
            className={inputClassName()}
          >
            {template.availableVariants.map((variant) => <option key={variant} value={variant}>{variant}</option>)}
          </select>
        </label>
        <p className="self-end pb-2 text-xs text-slate-500">
          {template.collectionSlug ? `Binding untuk koleksi ${template.collectionSlug}.` : "Template global; gunakan nilai statis untuk slot yang tidak terikat koleksi."}
        </p>
      </div>
      <div className="mt-4 space-y-3">
        {template.slots.map((slot) => {
          const binding = config.slots[slot.key] ?? { source: "static" as const, value: "" }
          const savedBindingStatus = template.bindingStatuses[slot.key]
          const bindingStatus = savedBindingStatus ?? (slot.required ? "required_empty" : "unmapped")
          const bindingStatusClass = bindingStatus === "ok"
            ? "text-emerald-700"
            : bindingStatus === "required_empty"
              ? "text-amber-700"
              : bindingStatus === "unmapped"
                ? "text-slate-500"
                : "text-rose-700"
          return (
            <div key={slot.key} className="grid gap-2 rounded-lg border border-slate-100 p-3 md:grid-cols-[1fr_1fr_1.5fr] md:items-end">
              <div>
                <p className="text-xs font-semibold text-slate-800">{slot.key}{slot.required ? " *" : ""}</p>
                <p className="mt-1 text-[11px] text-slate-500">Tipe slot: {slot.type}</p>
                <p className={`mt-1 text-[11px] font-medium ${bindingStatusClass}`}>{bindingStatusLabel[bindingStatus] ?? bindingStatus}</p>
              </div>
              <label className="text-[11px] font-medium text-slate-600">Sumber slot
                <select
                  aria-label={`Sumber slot ${slot.key}`}
                  value={binding.source}
                  onChange={(event) => onChangeSlot(slot.key, event.target.value === "field"
                    ? { source: "field", key: template.fields[0]?.key ?? "" }
                    : { source: "static", value: "" })}
                  className={inputClassName()}
                >
                  <option value="field" disabled={!template.fields.length}>Field koleksi</option>
                  <option value="static">Nilai statis</option>
                </select>
              </label>
              {binding.source === "field" ? (
                <label className="text-[11px] font-medium text-slate-600">Field koleksi
                  <select
                    aria-label={`Field untuk slot ${slot.key}`}
                    value={binding.key}
                    onChange={(event) => onChangeSlot(slot.key, { source: "field", key: event.target.value })}
                    className={inputClassName()}
                    disabled={!template.fields.length}
                  >
                    <option value="" disabled>Pilih field...</option>
                    {template.fields.map((field) => <option key={field.key} value={field.key}>{field.label} ({field.type})</option>)}
                  </select>
                  {!template.fields.length && <span className="mt-1 block font-normal text-amber-700">Slot ini belum memiliki field koleksi.</span>}
                </label>
              ) : (
                <label className="text-[11px] font-medium text-slate-600">Nilai statis
                  <input
                    aria-label={`Nilai statis slot ${slot.key}`}
                    value={binding.value}
                    onChange={(event) => onChangeSlot(slot.key, { source: "static", value: event.target.value })}
                    className={inputClassName()}
                  />
                </label>
              )}
            </div>
          )
        })}
        {!template.slots.length && <p className="text-xs text-slate-500">Template ini belum mendefinisikan slot.</p>}
      </div>
    </div>
  )
}
