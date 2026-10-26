"use client"

import { useCallback, useMemo, useState, useSyncExternalStore } from "react"
import { hasPermission } from "@/lib/auth/permissions"
import { blankDraft } from "@/hooks/cms/draft"
import { fetchCmsData, mutateCmsData } from "@/lib/cms/client/api"
import { cmsModuleEngine } from "@/lib/cms/module-engine"
import { createCollectionItemData } from "@/lib/cms/collection-fields"
import type {
  ModuleKey,
  RecordKey,
  Status,
} from "@/types/type-cms"
import type { CmsData, CmsRecord } from "@/types/type-cms-api"
import type { RecordDraft, TemplateConfigDraft, TemplateSlotDraft } from "@/types/type-cms-ui"

function subscribeToHash(callback: () => void) {
  window.addEventListener("hashchange", callback)
  return () => window.removeEventListener("hashchange", callback)
}

function getHashSnapshot() {
  return window.location.hash.slice(1)
}

function getServerHashSnapshot() {
  return ""
}

function isModuleKey(value: string): value is ModuleKey {
  return Object.hasOwn(cmsModuleEngine, value)
}

export function useCmsStudio({
  initialData,
  permissions,
  initialModule,
  collectionSlug,
  titleField,
  summaryField,
}: {
  initialData: CmsData
  permissions: string[]
  initialModule?: ModuleKey
  collectionSlug?: string
  titleField: string
  summaryField: string
}) {
  const hash = useSyncExternalStore(
    subscribeToHash,
    getHashSnapshot,
    getServerHashSnapshot,
  )
  const [data, setData] = useState<CmsData>(initialData)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState("")
  const [writeError, setWriteError] = useState("")
  const [notice, setNotice] = useState("")
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("Semua status")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<RecordDraft>(blankDraft)
  const [userPassword, setUserPassword] = useState("")
  const [templateConfigDraft, setTemplateConfigDraft] = useState<TemplateConfigDraft | null>(null)

  const refreshData = useCallback(async () => {
    const result = await fetchCmsData()
    setData(result)
    setLoadError("")
  }, [])

  const reload = useCallback(() => {
    setLoading(true)
    void refreshData()
      .catch((error: unknown) => {
        setLoadError(error instanceof Error ? error.message : "Data CMS gagal dimuat.")
      })
      .finally(() => setLoading(false))
  }, [refreshData])

  const active: ModuleKey = collectionSlug && initialModule && isModuleKey(initialModule)
    ? initialModule
    : isModuleKey(hash)
      ? hash
      : initialModule && isModuleKey(initialModule)
        ? initialModule
        : "overview"
  const activeCollectionSlug = collectionSlug ?? (active === "items"
    ? data.records.collections.find((collection) =>
      collection.status === "Terbit" && ["content", "hybrid"].includes(collection.collectionMode || ""),
    )?.slug
    : undefined)

  async function persist(module: ModuleKey, method: "POST" | "PATCH" | "DELETE", body: Record<string, unknown>, successMessage: string) {
    try {
      await mutateCmsData(module, method, body)
      await refreshData()
      setWriteError("")
      setNotice(successMessage)
      return true
    } catch (error) {
      setWriteError(error instanceof Error ? error.message : "Perubahan tidak dapat disimpan.")
      return false
    }
  }

  const activeModule = cmsModuleEngine[active]
  const canAccessModule = !activeModule.permission || hasPermission(permissions, activeModule.permission)
  const canCreateRecord = Boolean(activeModule.canCreateRecord)
  const canManageRecords = Boolean(activeModule.managePermission && hasPermission(permissions, activeModule.managePermission))
  const canPublishItems = hasPermission(permissions, "collection.items.publish")
  const records = useMemo(
    () => activeModule.recordKey
      ? data.records[activeModule.recordKey].filter((record) => active !== "items" || !activeCollectionSlug || record.collectionSlug === activeCollectionSlug)
      : [],
    [active, activeCollectionSlug, activeModule.recordKey, data.records],
  )
  const visibleRecords = useMemo(() => records.filter((record) => {
    const matchesQuery = `${record.title} ${record.slug} ${record.description} ${record.fields} ${JSON.stringify(record.itemData ?? {})}`
      .toLocaleLowerCase("id")
      .includes(query.toLocaleLowerCase("id"))
    return matchesQuery && (statusFilter === "Semua status" || record.status === statusFilter)
  }), [query, records, statusFilter])

  function openNewRecord() {
    setEditingId("")
    setUserPassword("")
    setTemplateConfigDraft(null)
    const targetCollectionSlug = activeCollectionSlug
    setDraft({
      ...blankDraft,
      status: active === "submissions" ? "Baru" : active === "users" || active === "collections" ? "Terbit" : "Draf",
      fields: active === "users" ? "role: kontributor" : active === "items" && targetCollectionSlug ? `collection_slug: ${targetCollectionSlug}` : "",
      itemData: active === "collections"
        ? { hasPublicDetail: false }
        : createCollectionItemData(
          data.records.collections.find((collection) => collection.slug === targetCollectionSlug)?.collectionFields ?? [],
          [titleField, summaryField],
        ),
    })
  }

  function openEditRecord(record: CmsRecord) {
    setEditingId(record.id)
    const template = active === "templates"
      ? data.templateConfigs.find((config) => config.templateId === record.id)
      : undefined
    setTemplateConfigDraft(template ? {
      variant: template.variant,
      slots: Object.fromEntries(template.slots.map((slot) => {
        const binding = template.bindings[slot.key]
        if (binding?.source === "field") {
          return [slot.key, { source: "field" as const, key: binding.key }]
        }
        if (binding?.source === "static") {
          return [slot.key, {
            source: "static" as const,
            value: typeof binding.value === "string" ? binding.value : JSON.stringify(binding.value ?? ""),
          }]
        }
        const matchingField = template.fields.find((field) => field.key === slot.key)
        return [slot.key, matchingField
          ? { source: "field" as const, key: matchingField.key }
          : { source: "static" as const, value: "" }]
      })),
    } : null)
    setDraft({
      title: record.title,
      slug: record.slug,
      description: record.description,
      fields: active === "items" ? `collection_slug: ${record.collectionSlug || activeCollectionSlug || ""}` : record.fields,
      status: record.status,
      itemData: active === "collections"
        ? { hasPublicDetail: record.hasPublicDetail ?? false }
        : record.itemData ?? {},
    })
  }

  function saveRecord(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!activeModule.recordKey || !draft.title.trim()) return
    const isUpdate = Boolean(editingId)
    const payload: Record<string, unknown> = { id: editingId || undefined, record: draft }
    if (active === "users" && userPassword) payload.password = userPassword
    if (active === "templates") {
      if (!templateConfigDraft) {
        setWriteError("Konfigurasi template tidak dapat dimuat. Muat ulang halaman lalu coba lagi.")
        return
      }
      payload.templateConfig = templateConfigDraft
    }
    void persist(active, isUpdate ? "PATCH" : "POST", payload, "Perubahan tersimpan di database.")
      .then((saved) => {
        if (saved) {
          setEditingId(null)
          setUserPassword("")
          setTemplateConfigDraft(null)
        }
      })
  }

  function updateTemplateSlot(slotKey: string, value: TemplateSlotDraft) {
    setTemplateConfigDraft((current) => current
      ? { ...current, slots: { ...current.slots, [slotKey]: value } }
      : current)
  }

  function updateTemplateVariant(variant: string) {
    setTemplateConfigDraft((current) => current ? { ...current, variant } : current)
  }

  function updateRecordStatus(record: CmsRecord) {
    if (!activeModule.recordKey) return
    const nextStatus: Status = record.status === "Terbit"
      ? active === "collections" ? "Diarsipkan" : "Draf"
      : "Terbit"
    const updated = {
      ...record,
      fields: active === "items" ? `collection_slug: ${record.collectionSlug || activeCollectionSlug || ""}` : record.fields,
      status: nextStatus,
    }
    void persist(active, "PATCH", { id: record.id, record: updated }, `Status "${record.title}" diperbarui.`)
  }

  function deleteRecord(record: CmsRecord) {
    if (!activeModule.recordKey || !window.confirm(`Hapus "${record.title}"?`)) return
    void persist(active, "DELETE", { id: record.id }, `"${record.title}" dihapus.`)
  }

  function saveIdentity(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void persist("identity", "PATCH", { identity: data.identity }, "Identitas tersimpan.")
  }

  function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void persist("settings", "PATCH", { settings: data.settings }, "Pengaturan tersimpan.")
  }

  function dismissNotice() {
    setNotice("")
    setWriteError("")
  }

  const countRecords = (key: RecordKey) => data.records[key].length
  const totalItems = Object.values(data.records).reduce((total, items) => total + items.length, 0)

  return {
    data,
    setData,
    loading,
    loadError,
    writeError,
    notice,
    setNotice,
    dismissNotice,
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    editingId,
    setEditingId,
    draft,
    setDraft,
    userPassword,
    setUserPassword,
    templateConfigDraft,
    setTemplateConfigDraft,
    updateTemplateVariant,
    updateTemplateSlot,
    active,
    collectionSlug: activeCollectionSlug,
    activeModule,
    canAccessModule,
    canCreateRecord,
    canManageRecords,
    canPublishItems,
    canUploadMedia: hasPermission(permissions, "media.upload"),
    records,
    visibleRecords,
    reload,
    refreshData,
    openNewRecord,
    openEditRecord,
    saveRecord,
    updateRecordStatus,
    deleteRecord,
    saveIdentity,
    saveSettings,
    countRecords,
    totalItems,
  }
}
