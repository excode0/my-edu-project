import type { LucideIcon } from "lucide-react"

export type SidebarChildConfig = {
  label: string
  href: string
  permission?: string
}

export type SidebarGroupConfig = {
  label: string
  icon: LucideIcon
  hrefBase: string
  permission?: string
  children?: SidebarChildConfig[]
}
