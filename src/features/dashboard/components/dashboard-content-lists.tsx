import Link from "next/link"
import { ChevronRight, type LucideIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { dynamicContentItems, staticContentItems } from "../lib/dashboard-content"

type ContentItem = {
  title: string
  status: string
  color: string
  icon: LucideIcon
  id: string
}

function ContentItemList({ items }: { items: ContentItem[] }) {
  return (
    <div className="space-y-2 px-5 pb-5 sm:px-6">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <Link
            key={item.title}
            href={`/dashboard#${item.id}`}
            className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-violet-200 hover:bg-violet-50/30"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <Icon className="size-4" />
            </div>
            <p className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
              {item.title}
            </p>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${item.color}`}>
              {item.status}
            </span>
            <ChevronRight className="hidden size-4 text-slate-300 sm:block" />
          </Link>
        )
      })}
    </div>
  )
}

export function DashboardContentLists() {
  return (
    <div className="grid content-start gap-5">
      <Card className="border-0 bg-white shadow-sm shadow-slate-200/60">
        <CardHeader className="px-5 pt-5 sm:px-6">
          <CardTitle className="text-base font-semibold">Halaman statis</CardTitle>
          <p className="text-sm text-slate-500">Informasi inti yang berubah sesekali.</p>
        </CardHeader>
        <CardContent className="p-0">
          <ContentItemList items={staticContentItems} />
        </CardContent>
      </Card>

      <Card className="border-0 bg-white shadow-sm shadow-slate-200/60">
        <CardHeader className="px-5 pt-5 sm:px-6">
          <CardTitle className="text-base font-semibold">Konten berkala</CardTitle>
          <p className="text-sm text-slate-500">Publikasi yang diperbarui secara berkala.</p>
        </CardHeader>
        <CardContent className="p-0">
          <ContentItemList items={dynamicContentItems} />
        </CardContent>
      </Card>
    </div>
  )
}
