"use client"

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react"
import { blankDraft } from "../lib/format"
import { createInitialData } from "../lib/demo-data"
import { modules } from "../lib/modules"
import type {
  CmsData,
  CmsRecord,
  ModuleKey,
  RecordDraft,
  RecordKey,
  Status,
  TemplateConfigDraft,
  TemplateSlotDraft,
} from "../types"

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
  return modules.some((module) => module.key === value)
}

export function useCmsStudio({
  permissions,
  initialModule,
}: {
  permissions: string[]
  initialModule?: ModuleKey
}) {
  const hash = useSyncExternalStore(
    subscribeToHash,
    getHashSnapshot,
    getServerHashSnapshot,
  )
  const [data, setData] = useState<CmsData>(createInitialData)
  const [loading, setLoading] = useState(true)
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
    const response = await fetch("/api/admin/cms", { cache: "no-store" })
    const result = await response.json() as CmsData & { error?: string }
    if (!response.ok) throw new Error(result.error || "Data CMS gagal dimuat.")
    setData(result)
    setLoadError("")
  }, [])

  useEffect(() => {
    void Promise.resolve()
      .then(refreshData)
      .catch((error: unknown) => {
        setLoadError(error instanceof Error ? error.message : "Data CMS gagal dimuat.")
      })
      .finally(() => setLoading(false))
  }, [refreshData])

  const reload = useCallback(() => {
    setLoading(true)
    void refreshData()
      .catch((error: unknown) => {
        setLoadError(error instanceof Error ? error.message : "Data CMS gagal dimuat.")
      })
      .finally(() => setLoading(false))
  }, [refreshData])

  const active: ModuleKey = isModuleKey(hash)
    ? hash
    : initialModule && isModuleKey(initialModule)
      ? initialModule
      : "overview"

  async function persist(module: ModuleKey, method: "POST" | "PATCH" | "DELETE", body: Record<string, unknown>, successMessage: string) {
    try {
      const response = await fetch("/api/admin/cms", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module, ...body }),
      })
      const result = await response.json() as { error?: string }
      if (!response.ok) throw new Error(result.error || "Perubahan tidak dapat disimpan.")
      await refreshData()
      setWriteError("")
      setNotice(successMessage)
      return true
    } catch (error) {
      setWriteError(error instanceof Error ? error.message : "Perubahan tidak dapat disimpan.")
      return false
    }
  }

  const activeModule = modules.find((module) => module.key === active) ?? modules[0]
  const canAccessModule = !activeModule.permission || permissions.includes(activeModule.permission)
  const canCreateRecord = active === "collections" || active === "items" || active === "pages" || active === "navigation" || active === "users"
  const canManageRecords = active === "identity"
    ? permissions.includes("identitas.update")
    : active === "settings"
      ? permissions.includes("settings.manage")
      : active === "collections"
        ? permissions.includes("collection.fields.manage")
        : active === "items"
          ? permissions.includes("collection.items.create")
          : active === "pages"
            ? permissions.includes("pages.manage")
            : active === "navigation"
              ? permissions.includes("menu.manage")
              : active === "submissions"
                ? permissions.includes("submission.update")
                : active === "users"
                  ? permissions.includes("user.manage")
                  : active === "media"
                    ? permissions.includes("media.upload")
                    : active === "templates" && permissions.includes("template.config.manage")
  const canPublishItems = permissions.includes("collection.items.publish")
  const records = useMemo(
    () => activeModule.recordKey ? data.records[activeModule.recordKey] : [],
    [activeModule.recordKey, data.records],
  )
  const visibleRecords = useMemo(() => records.filter((record) => {
    const matchesQuery = `${record.title} ${record.slug} ${record.description} ${record.fields}`
      .toLocaleLowerCase("id")
      .includes(query.toLocaleLowerCase("id"))
    return matchesQuery && (statusFilter === "Semua status" || record.status === statusFilter)
  }), [query, records, statusFilter])

  function openNewRecord() {
    setEditingId("")
    setUserPassword("")
    setTemplateConfigDraft(null)
    setDraft({
      ...blankDraft,
      status: active === "submissions" ? "Baru" : active === "users" || active === "collections" ? "Terbit" : "Draf",
      fields: active === "users" ? "role: kontributor" : active === "items" ? "collection_slug: berita" : "",
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
      fields: record.fields,
      status: record.status,
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
    const updated = { ...record, status: nextStatus }
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
    activeModule,
    canAccessModule,
    canCreateRecord,
    canManageRecords,
    canPublishItems,
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
