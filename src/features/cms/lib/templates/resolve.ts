export type TemplateSlotValue =
  | { source: "field"; key: string }
  | { source: "static"; value: unknown }

export type ResolvedTemplateProps<T = Record<string, unknown>> = {
  data: T
  config: Record<string, unknown>
  variant: string
  slots: Record<string, TemplateSlotValue>
}

export function resolveTemplateProps<T extends Record<string, unknown>>(
  itemData: T,
  slots: Record<string, unknown>,
): ResolvedTemplateProps<T> {
  const resolved: Record<string, unknown> = {}
  for (const [slotKey, slot] of Object.entries(slots || {})) {
    if (!slot || typeof slot !== "object") continue
    const s = slot as Record<string, unknown>
    if (s.source === "field" && typeof s.key === "string") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolved[slotKey] = (itemData as any)[s.key]
      continue
    }
    if (s.source === "static") {
      resolved[slotKey] = s.value
      continue
    }
  }
  return {
    data: itemData,
    config: {},
    variant: "default",
    slots: slots as Record<string, TemplateSlotValue>,
  }
}