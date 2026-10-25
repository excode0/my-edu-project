import { db } from "@/lib/db"
import { isRecord } from "./shared"
import type { TemplateEditorConfig } from "./types"

type TemplateConfigRow = {
  template_id: string
  config_id: string | null
  variant: string | null
  available_variants: unknown
  scope: string | null
  collection_slug: string | null
  schema: unknown
  configured_slots: unknown
  binding_statuses: unknown
  collection_fields: unknown
}

export async function loadTemplateConfigs(): Promise<TemplateEditorConfig[]> {
  const result = await db.query<TemplateConfigRow>(
    `SELECT t.id AS template_id, default_config.id AS config_id,
      default_config.variant, t.available_variants,
      default_config.scope::text AS scope, c.slug AS collection_slug,
      t."schema", COALESCE(default_config.slots, '{}'::jsonb) AS configured_slots,
      COALESCE(binding_list.statuses, '{}'::jsonb) AS binding_statuses,
      COALESCE(field_list.fields, '[]'::jsonb) AS collection_fields
     FROM templates t
     LEFT JOIN LATERAL (
       SELECT id, variant, scope, collection_id, slots
       FROM template_configs
       WHERE template_id = t.id AND is_default
       ORDER BY updated_at DESC LIMIT 1
     ) default_config ON true
     LEFT JOIN collections c ON c.id = default_config.collection_id
     LEFT JOIN LATERAL (
       SELECT jsonb_object_agg(tb.slot_key, tb.status::text) AS statuses
       FROM template_bindings tb
       WHERE tb.template_config_id = default_config.id
     ) binding_list ON true
     LEFT JOIN LATERAL (
       SELECT jsonb_agg(jsonb_build_object(
         'key', cf.key, 'label', cf.label, 'type', cf.field_type::text
       ) ORDER BY cf.sort_order, cf.key) AS fields
       FROM collection_fields cf
       WHERE cf.collection_id = default_config.collection_id
     ) field_list ON true
     WHERE t.is_active = true
     ORDER BY t.nama`,
  )

  return result.rows.map((row) => {
    const schema = isRecord(row.schema) ? row.schema : {}
    const configuredSlots = isRecord(row.configured_slots) ? row.configured_slots : {}
    const parseList = (value: unknown) => Array.isArray(value) ? value : []
    const bindings: TemplateEditorConfig["bindings"] = {}
    const bindingStatuses: Record<string, string> = {}
    for (const [key, value] of Object.entries(configuredSlots)) {
      if (!isRecord(value)) continue
      const binding = value
      if (binding.source === "field" && typeof binding.key === "string") {
        bindings[key] = { source: "field", key: binding.key }
      } else if (binding.source === "static") {
        bindings[key] = { source: "static", value: binding.value ?? "" }
      }
    }
    if (isRecord(row.binding_statuses)) {
      for (const [key, value] of Object.entries(row.binding_statuses)) {
        if (typeof value === "string") bindingStatuses[key] = value
      }
    }
    return {
      templateId: row.template_id,
      configId: row.config_id,
      variant: row.variant ?? "default",
      availableVariants: parseList(row.available_variants).map(String),
      scope: row.scope ?? "global",
      collectionSlug: row.collection_slug ?? "",
      slots: parseList(schema.slots).flatMap((slot) => {
        if (!isRecord(slot)) return []
        const definition = slot
        if (typeof definition.key !== "string" || typeof definition.type !== "string") return []
        return [{
          key: definition.key,
          type: definition.type,
          required: definition.required === true,
        }]
      }),
      bindings,
      bindingStatuses,
      fields: parseList(row.collection_fields).flatMap((field) => {
        if (!isRecord(field)) return []
        const definition = field
        if (
          typeof definition.key !== "string" ||
          typeof definition.label !== "string" ||
          typeof definition.type !== "string"
        ) return []
        return [{ key: definition.key, label: definition.label, type: definition.type }]
      }),
    }
  })
}
