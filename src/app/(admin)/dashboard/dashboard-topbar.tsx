"use client"

import { Bell, ChevronRight, HelpCircle } from "lucide-react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { LogoutButton } from "./logout-button"

const roleNames: Record<string, string> = {
  superadmin: "Superadministrator",
  admin: "Administrator",
  editor: "Editor",
  kontributor: "Kontributor",
  viewer: "Viewer",
}

export function DashboardTopbar({ userName, role }: { userName: string; role: string }) {
  const pathname = usePathname()
  const pageTitle = pathname === "/dashboard/cms" ? "Studio CMS" : "Ringkasan"

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur sm:px-7">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger className="text-slate-500 hover:bg-slate-100" />
        <div className="hidden h-5 w-px bg-slate-200 sm:block" />
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <span className="hidden text-slate-400 sm:inline">Website Sekolah</span>
          <ChevronRight className="hidden size-3.5 shrink-0 text-slate-300 sm:inline" />
          <span className="truncate font-medium text-slate-800">{pageTitle}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Pusat bantuan"
          className="text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        >
          <HelpCircle />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifikasi"
          className="relative text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        >
          <Bell />
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full border-2 border-white bg-rose-500" />
        </Button>
        <div className="ml-1 hidden h-8 w-px bg-slate-200 sm:block" />
        <div className="flex items-center gap-2.5">
          <div className="hidden text-right sm:block">
            <p className="text-xs font-semibold text-slate-800">{userName}</p>
            <p className="mt-0.5 text-[10px] text-slate-500">{roleNames[role] ?? role}</p>
          </div>
          <div className="flex size-9 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700 ring-1 ring-violet-200">
            {userName.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("")}
          </div>
        </div>
        <LogoutButton />
      </div>
    </header>
  )
}
