import type { AuthUser } from "@/features/auth/server/auth"
import { withTransaction } from "@/lib/db"
import { writeAudit } from "./audit"
import { ApiError } from "./errors"
import type { MutationInput } from "./schemas"

export async function saveTemplateConfig(
  user: AuthUser,
  templateId: string,
  config: NonNullable<MutationInput["templateConfig"]>,
) {
  return withTransaction(async (client) => {
    const result = await client.query<{
      config_id: string | null
      current_variant: string | null
      available_variants: unknown
      schema: unknown
      current_slots: unknown
      collection_id: string | null
    }>(
      `SELECT default_config.id AS config_id, default_config.variant AS current_variant,
        default_config.slots AS current_slots, default_config.collection_id,
        t.available_variants, t."schema"
       FROM templates t
       LEFT JOIN LATERAL (
         SELECT id, variant, slots, collection_id FROM template_configs
         WHERE template_id = t.id AND is_default
         ORDER BY updated_at DESC LIMIT 1
       ) default_config ON true
       WHERE t.id = $1 AND t.is_active = true
       FOR UPDATE OF t`,
      [templateId],
    )
    const template = result.rows[0]
    if (!template) throw new ApiError("Template tidak ditemukan atau tidak aktif.", 404)
    const availableVariants = Array.isArray(template.available_variants)
      ? template.available_variants.map(String)
      : []
    if (!availableVariants.includes(config.variant)) {
      throw new ApiError("Varian tersebut tidak tersedia untuk template ini.")
    }
    if (!template.config_id) throw new ApiError("Konfigurasi default template belum tersedia.", 409)

    const templateSchema = template.schema && typeof template.schema === "object" && !Array.isArray(template.schema)
      ? template.schema as { slots?: unknown }
      : {}
    const slotDefinitions = Array.isArray(templateSchema.slots)
      ? templateSchema.slots.flatMap((slot) => {
          if (!slot || typeof slot !== "object" || Array.isArray(slot)) return []
          const definition = slot as Record<string, unknown>
          if (typeof definition.key !== "string" || typeof definition.type !== "string") return []
          return [{ key: definition.key, type: definition.type, required: definition.required === true }]
        })
      : []
    const definitionsByKey = new Map(slotDefinitions.map((slot) => [slot.key, slot]))
    if (Object.keys(config.slots).some((key) => !definitionsByKey.has(key))) {
      throw new ApiError("Konfigurasi berisi slot yang tidak tersedia pada template.")
    }
    const fieldResult = template.collection_id
      ? await client.query<{ id: string; key: string; field_type: string }>(
        "SELECT id, key, field_type::text FROM collection_fields WHERE collection_id = $1",
        [template.collection_id],
      )
      : { rows: [] as { id: string; key: string; field_type: string }[] }
    const fieldsByKey = new Map(fieldResult.rows.map((field) => [field.key, field]))
    const compatibleTypes: Record<string, string[]> = {
      text: ["text", "email", "phone", "url"],
      textarea: ["text", "textarea", "richtext"],
      richtext: ["richtext", "textarea"],
      media: ["media", "media_multiple"],
      fields: ["json"],
    }
    const slotValues: Record<string, { source: "field"; key: string } | { source: "static"; value: string }> = {}
    const bindingRows: {
      slotKey: string
      fieldId: string | null
      staticValue: string | null
      status: "ok" | "missing_field" | "type_mismatch" | "required_empty"
    }[] = []

    for (const slot of slotDefinitions) {
      const requested = config.slots[slot.key] ?? { source: "static" as const, value: "" }
      if (requested.source === "field") {
        const field = fieldsByKey.get(requested.key)
        const status = !field
          ? "missing_field"
          : compatibleTypes[slot.type]?.includes(field.field_type)
            ? "ok"
            : "type_mismatch"
        slotValues[slot.key] = { source: "field", key: requested.key }
        bindingRows.push({ slotKey: slot.key, fieldId: field?.id ?? null, staticValue: null, status })
      } else {
        const status = slot.required && !requested.value.trim() ? "required_empty" : "ok"
        slotValues[slot.key] = { source: "static", value: requested.value }
        bindingRows.push({
          slotKey: slot.key,
          fieldId: null,
          staticValue: JSON.stringify(requested.value),
          status,
        })
      }
    }

    await client.query(
      `UPDATE template_configs SET variant = $1, slots = $2::jsonb,
        version = version + 1, updated_at = now() WHERE id = $3`,
      [config.variant, JSON.stringify(slotValues), template.config_id],
    )
    await client.query("DELETE FROM template_bindings WHERE template_config_id = $1", [template.config_id])
    for (const binding of bindingRows) {
      await client.query(
        `INSERT INTO template_bindings
          (template_config_id, slot_key, collection_field_id, static_value, status, synced_at)
         VALUES ($1, $2, $3, $4::jsonb, $5::binding_status, now())`,
        [template.config_id, binding.slotKey, binding.fieldId, binding.staticValue, binding.status],
      )
    }
    await writeAudit(
      client,
      user,
      "template.config.update",
      "template_configs",
      template.config_id,
      { variant: template.current_variant, slots: template.current_slots },
      { variant: config.variant, slots: slotValues, bindings: bindingRows },
    )
  })
}
