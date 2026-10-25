import { Suspense } from "react"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { requireUser } from "@/lib/auth/server/auth"
import { DashboardSidebar } from "@/components/dashboard/layout/dashboard-sidebar"
import { DashboardTopbar } from "@/components/dashboard/layout/dashboard-topbar"

export const instant = false

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f7f8fa]" aria-label="Memuat dashboard" />}>
      <AuthenticatedDashboard>{children}</AuthenticatedDashboard>
    </Suspense>
  )
}

async function AuthenticatedDashboard({ children }: { children: React.ReactNode }) {
  const user = await requireUser()

  return (
    <SidebarProvider defaultOpen>
      <DashboardSidebar userName={user.name} role={user.role} permissions={user.permissions} />
      <SidebarInset className="min-h-screen min-w-0 flex-1 bg-[#f7f8fa]">
        <DashboardTopbar userName={user.name} role={user.role} />
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
