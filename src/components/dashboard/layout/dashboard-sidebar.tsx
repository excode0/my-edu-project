"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { School, Users } from "lucide-react"
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
import { sidebarGroups } from "./navigation"
import { hasPermission } from "@/lib/auth/permissions"

export function DashboardSidebar({
  userName,
  role,
  permissions,
}: {
  userName: string
  role: string
  permissions: string[]
}) {
  const pathname = usePathname()
  const visibleGroups = sidebarGroups.filter(
    (group) => !group.permission || hasPermission(permissions, group.permission),
  )

  return (
    <Sidebar collapsible="icon" className="border-r border-slate-200 bg-white">
      <SidebarHeader className="border-b border-slate-100">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-violet-700 text-white">
            <School className="size-4" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <p className="text-sm font-semibold leading-tight">Panel Sekolah</p>
            <p className="text-[11px] text-slate-500">Manajemen konten</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigasi</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleGroups.map((group) => {
                const Icon = group.icon
                const visibleChildren = group.children?.filter(
                  (child) => !child.permission || hasPermission(permissions, child.permission),
                )
                if (!group.children) {
                  return (
                    <SidebarMenuItem key={group.label}>
                      <SidebarMenuButton
                        isActive={pathname === group.hrefBase}
                        render={<Link href={group.hrefBase}><><Icon /><span>{group.label}</span></></Link>}
                      />
                    </SidebarMenuItem>
                  )
                }
                if (!visibleChildren?.length) return null
                const groupActive = visibleChildren.some((child) => child.href === pathname)
                return (
                  <SidebarMenuItem key={group.label}>
                    <SidebarMenuButton
                      isActive={groupActive || pathname === group.hrefBase}
                      render={<Link href={group.hrefBase}><><Icon /><span>{group.label}</span></></Link>}
                    />
                    <SidebarMenuSub>
                      {visibleChildren.map((child) => (
                        <SidebarMenuSubItem key={child.label}>
                          <SidebarMenuSubButton
                            isActive={pathname === child.href}
                            render={<Link href={child.href}>{child.label}</Link>}
                          />
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-slate-100">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
            <Users className="size-4" />
          </div>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-medium">{userName}</p>
            <p className="truncate text-[11px] text-slate-500">{role}</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
