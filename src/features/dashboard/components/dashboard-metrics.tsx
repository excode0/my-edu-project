import { ArrowUpRight, MoreHorizontal } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { metrics } from "../lib/dashboard-content"

export function DashboardMetrics() {
  return (
    <section id="analytics" aria-label="Ringkasan statistik" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon
        return (
          <Card key={metric.label} className="border-0 bg-white shadow-sm shadow-slate-200/60">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className={`flex size-10 items-center justify-center rounded-xl ${metric.color}`}>
                  <Icon className="size-5" />
                </div>
                <button type="button" aria-label={`Opsi ${metric.label}`} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100">
                  <MoreHorizontal className="size-4" />
                </button>
              </div>
              <p className="mt-4 text-sm text-slate-500">{metric.label}</p>
              <div className="mt-1 flex flex-wrap items-end justify-between gap-2">
                <p className="text-2xl font-semibold tracking-tight text-slate-900">{metric.value}</p>
                <span className="mb-0.5 inline-flex items-center gap-0.5 text-xs font-medium text-emerald-700">
                  <ArrowUpRight className="size-3.5" />
                  {metric.change}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">{metric.note}</p>
            </CardContent>
          </Card>
        )
      })}
    </section>
  )
}
