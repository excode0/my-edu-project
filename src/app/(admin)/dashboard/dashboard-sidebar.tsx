"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { CSSProperties } from "react"
import { useState, useSyncExternalStore } from "react"
import {
  ChevronDown,
  FolderKanban,
  LayoutDashboard,
  Palette,
  School,
  Settings2,
  Users,
  type LucideIcon,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

type SidebarLink = {
  label: string
  target: string
  href?: string
  permission?: string
}

type SidebarGroupConfig = {
  label: string
  icon: LucideIcon
  children: SidebarLink[]
  hrefBase?: string
}

const contentGroups: SidebarGroupConfig[] = [
  {
    label: "Konten",
    icon: FolderKanban,
    hrefBase: "/dashboard/cms",
    children: [
      { label: "Identitas lembaga", target: "identity", permission: "identitas.update" },
      { label: "Koleksi", target: "collections", permission: "collection.fields.manage" },
      { label: "Artikel & agenda", target: "items", permission: "collection.items.create" },
      { label: "Halaman", target: "pages", permission: "pages.manage" },
      { label: "Pustaka media", target: "media", permission: "media.upload" },
      { label: "Form PPDB", target: "submissions", permission: "submission.view" },
    ],
  },
  {
    label: "Tampilan",
    icon: Palette,
    hrefBase: "/dashboard/cms",
    children: [
      { label: "Template & binding", target: "templates", permission: "template.view" },
      { label: "Navigasi", target: "navigation", permission: "menu.manage" },
      { label: "Tema website", target: "themes", href: "/dashboard#themes" },
    ],
  },
  {
    label: "Sistem",
    icon: Settings2,
    hrefBase: "/dashboard/cms",
    children: [
      { label: "Pengguna & role", target: "users", permission: "user.manage" },
      { label: "Pengaturan", target: "settings", permission: "settings.manage" },
      { label: "Log aktivitas", target: "audit", permission: "audit.view" },
    ],
  },
]

function NavigationGroup({
  group,
  initiallyOpen,
  currentTarget,
  permissions,
}: {
  group: SidebarGroupConfig
  initiallyOpen: boolean
  currentTarget: string
  permissions: string[]
}) {
  const [manualOpen, setManualOpen] = useState<boolean | null>(null)
  const open = manualOpen ?? initiallyOpen
  const Icon = group.icon

  return (
    <SidebarGroup className="px-3 py-1.5">
      <SidebarGroupContent>
        <SidebarMenu className="gap-0.5">
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setManualOpen(!open)}
              aria-expanded={open}
              className="h-9 text-[13px] font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <Icon />
              <span>{group.label}</span>
              <ChevronDown
                className={`ml-auto size-3.5 text-slate-500 transition-transform ${
                  open ? "rotate-180" : ""
                }`}
              />
            </SidebarMenuButton>
            {open && (
              <SidebarMenuSub className="ml-[18px] border-slate-700/80 py-1">
                {group.children.filter((child) => !child.permission || permissions.includes(child.permission)).map((child) => {
                  const href = child.href ?? `${group.hrefBase ?? "/dashboard"}#${child.target}`
                  const isActive = currentTarget === child.target
                  return (
                    <SidebarMenuSubItem key={child.target}>
                      <SidebarMenuSubButton
                        render={<a href={href} />}
                        isActive={isActive}
                        className="h-8 text-xs text-slate-400 hover:bg-slate-800 hover:text-white data-active:bg-violet-500/15 data-active:text-violet-200"
                      >
                        <span>{child.label}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )
                })}
              </SidebarMenuSub>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

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

const roleNames: Record<string, string> = {
  superadmin: "Superadministrator",
  admin: "Administrator",
  editor: "Editor",
  kontributor: "Kontributor",
  viewer: "Viewer",
}

export function DashboardSidebar({ userName, role, permissions }: { userName: string; role: string; permissions: string[] }) {
  const pathname = usePathname()
  const currentTarget = useSyncExternalStore(
    subscribeToHash,
    getHashSnapshot,
    getServerHashSnapshot,
  )
  const isCms = pathname === "/dashboard/cms"
  const isDashboard = pathname === "/dashboard"

  return (
    <Sidebar
      collapsible="icon"
      style={
        {
          "--sidebar": "#111827",
          "--sidebar-foreground": "#f8fafc",
          "--sidebar-accent": "#252d3d",
          "--sidebar-accent-foreground": "#ffffff",
          "--sidebar-border": "#293244",
          "--sidebar-primary": "#7c3aed",
          "--sidebar-primary-foreground": "#ffffff",
        } as CSSProperties
      }
    >
      <SidebarHeader className="px-5 pb-4 pt-5">
        <Link href="/dashboard" className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-950/30">
            <School className="size-5" />
          </span>
          <span className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold tracking-wide text-white">Sekolah</span>
            <span className="mt-0.5 text-[10px] font-medium tracking-[0.14em] text-slate-500">
              PANEL WEBSITE
            </span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="overflow-y-auto pt-2">
        <SidebarGroup className="px-3 py-1.5">
          <SidebarGroupLabel className="px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link href="/dashboard" />}
                  isActive={isDashboard}
                  className="h-10 text-[13px] text-slate-300 hover:bg-slate-800 hover:text-white data-active:bg-violet-600 data-active:text-white"
                  tooltip="Ringkasan"
                >
                  <LayoutDashboard />
                  <span>Ringkasan</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroupLabel className="px-6 pt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          Pengelolaan
        </SidebarGroupLabel>
        {contentGroups.map((group, index) => (
          <NavigationGroup
            key={group.label}
            group={{
              ...group,
              children: group.children.filter((child) => !child.permission || permissions.includes(child.permission)),
            }}
            initiallyOpen={
              (isCms && (index === 0 || currentTarget === "templates" || currentTarget === "navigation")) ||
              (group.label === "Tampilan" && currentTarget === "themes")
            }
            currentTarget={isCms ? currentTarget : ""}
            permissions={permissions}
          />
        )).filter((_, index) => contentGroups[index].children.some((child) => !child.permission || permissions.includes(child.permission)))}
      </SidebarContent>

      <SidebarFooter className="p-3">
        <div className="flex items-center gap-3 rounded-xl border border-slate-700/80 bg-slate-800/50 p-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-xs font-semibold text-violet-200">
            {userName.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("")}
          </div>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-xs font-medium text-white">{userName}</p>
            <p className="mt-0.5 truncate text-[10px] text-slate-400">{roleNames[role] ?? role}</p>
          </div>
          <Users className="size-4 shrink-0 text-slate-500 group-data-[collapsible=icon]:hidden" />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
