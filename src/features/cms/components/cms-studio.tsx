"use client"

import Link from "next/link"
import { Archive, ArrowUpRight, Plus, ShieldCheck, X } from "lucide-react"
import { useCmsStudio } from "../hooks/use-cms-studio"
import { CmsAuditLog } from "./cms-audit-log"
import { CmsIdentityForm } from "./cms-identity-form"
import { CmsOverview } from "./cms-overview"
import { CmsRecordWorkspace } from "./cms-record-workspace"
import { CmsSettingsForm } from "./cms-settings-form"
import type { ModuleKey } from "../types"

export function CmsStudio({ permissions, initialModule }: { permissions: string[]; initialModule?: ModuleKey }) {
  const cms = useCmsStudio({ permissions, initialModule })
  const { active, activeModule, data, setData, loading, loadError, writeError, notice } = cms
  const shownStorageError = loadError || writeError

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-8 sm:py-7 lg:px-10">
        <header className="flex flex-col justify-between gap-4 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-700">Studio CMS</p>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-800">PostgreSQL · tersimpan di server</span>
            </div>
            <h1 id="cms-page-title" className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[28px]">{activeModule.label}</h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">{activeModule.description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
            {activeModule.recordKey && cms.canCreateRecord && cms.canManageRecords && (
              <button type="button" onClick={cms.openNewRecord} className="inline-flex h-10 items-center gap-2 rounded-lg bg-violet-700 px-3.5 text-xs font-semibold text-white shadow-sm transition hover:bg-violet-800">
                <Plus className="size-4" /> Tambah {activeModule.noun}
              </button>
            )}
            <Link href="/" target="_blank" className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
              Lihat website <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </header>

        {(shownStorageError || notice) && (
          <div role={shownStorageError ? "alert" : "status"} className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${shownStorageError ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
            <span>{shownStorageError || notice}</span>
            <button type="button" aria-label="Tutup pemberitahuan" onClick={cms.dismissNotice} className="rounded p-0.5 opacity-70 hover:opacity-100"><X className="size-4" /></button>
          </div>
        )}

        <div className="min-w-0">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-12 text-center text-sm text-slate-500">Memuat data dari database...</div>
          ) : loadError ? (
            <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-6 text-sm text-rose-800">
              <span>{loadError}</span>
              <button type="button" onClick={cms.reload} className="rounded-md border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold hover:bg-rose-100">Coba lagi</button>
            </div>
          ) : !cms.canAccessModule ? (
            <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-12 text-center text-sm text-amber-900">Akun Anda tidak memiliki izin untuk membuka modul ini.</div>
          ) : <>
            <section id={active} aria-labelledby="cms-page-title" className="scroll-mt-24 min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              {active === "overview" && (
                <CmsOverview data={data} totalItems={cms.totalItems} countRecords={cms.countRecords} permissions={permissions} />
              )}

              {active === "identity" && (
                <CmsIdentityForm
                  identity={data.identity}
                  canManage={cms.canManageRecords}
                  onChange={(identity) => setData((current) => ({ ...current, identity }))}
                  onSubmit={cms.saveIdentity}
                />
              )}

              {active === "settings" && (
                <CmsSettingsForm
                  settings={data.settings}
                  canManage={cms.canManageRecords}
                  onChange={(settings) => setData((current) => ({ ...current, settings }))}
                  onSubmit={cms.saveSettings}
                />
              )}

              {activeModule.recordKey && (
                <CmsRecordWorkspace
                  active={active}
                  module={activeModule}
                  data={data}
                  canManage={cms.canManageRecords}
                  canPublish={cms.canPublishItems}
                  records={cms.records}
                  visibleRecords={cms.visibleRecords}
                  query={cms.query}
                  onQueryChange={cms.setQuery}
                  statusFilter={cms.statusFilter}
                  onStatusFilterChange={cms.setStatusFilter}
                  editingId={cms.editingId}
                  draft={cms.draft}
                  onDraftChange={cms.setDraft}
                  userPassword={cms.userPassword}
                  onUserPasswordChange={cms.setUserPassword}
                  templateConfigDraft={cms.templateConfigDraft}
                  onChangeTemplateVariant={cms.updateTemplateVariant}
                  onChangeTemplateSlot={cms.updateTemplateSlot}
                  onSave={cms.saveRecord}
                  onEdit={cms.openEditRecord}
                  onToggleStatus={cms.updateRecordStatus}
                  onDelete={cms.deleteRecord}
                  onCloseEditor={() => cms.setEditingId(null)}
                  onUploaded={cms.refreshData}
                />
              )}

              {active === "audit" && <CmsAuditLog entries={data.audit} />}
            </section>
            <footer className="mt-4 flex flex-wrap items-start gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[11px] leading-relaxed text-slate-500">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-amber-600" />
              <p>Operasi CMS memakai PostgreSQL, sesi HttpOnly, dan pemeriksaan izin di server. File tersimpan lokal selama pengembangan; produksi perlu storage eksternal, HTTPS, dan backup.</p>
            </footer>
            <div className="mt-3 flex justify-end px-1">
              <button type="button" onClick={cms.reload} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-500 transition hover:bg-slate-100">
                <Archive className="size-3.5" /> Muat ulang dari database
              </button>
            </div>
          </>}
        </div>
      </div>
    </div>
  )
}
