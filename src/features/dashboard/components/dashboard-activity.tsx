import Link from "next/link"
import { ChevronRight, Clock3 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { activities } from "../lib/dashboard-content"

export function DashboardActivity() {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-1">
      <Card id="activity" className="border-0 bg-white shadow-sm shadow-slate-200/60">
        <CardHeader className="flex flex-row items-center justify-between px-5 pt-5">
          <div>
            <CardTitle className="text-base font-semibold">Aktivitas terbaru</CardTitle>
            <p className="mt-1 text-sm text-slate-500">Pembaruan konten website</p>
          </div>
          <Clock3 className="size-4 text-slate-400" />
        </CardHeader>
        <CardContent className="space-y-4 px-5 pb-5">
          {activities.map((activity) => {
            const Icon = activity.icon
            return (
              <div key={activity.title} className="flex items-start gap-3">
                <div className={`flex size-9 shrink-0 items-center justify-center rounded-full ${activity.color}`}>
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-snug text-slate-800">{activity.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{activity.detail}</p>
                </div>
                <span className="shrink-0 pt-0.5 text-[10px] text-slate-400">{activity.time}</span>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card id="messages" className="border-0 bg-white shadow-sm shadow-slate-200/60">
        <CardHeader className="px-5 pt-5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Pesan pengunjung</CardTitle>
            <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-medium text-violet-700">4 baru</span>
          </div>
          <p className="text-sm text-slate-500">Pertanyaan dari calon siswa dan orang tua</p>
        </CardHeader>
        <CardContent className="pb-5">
          <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-700">AR</div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-800">Informasi pendaftaran siswa baru</p>
              <p className="mt-1 text-xs text-slate-500">Apakah pendaftaran tahun ajaran baru sudah dibuka?</p>
              <p className="mt-2 text-[10px] text-slate-400">Aulia Rahma · 25 menit lalu</p>
            </div>
          </div>
          <Link href="/dashboard#admissions" className="mt-3 flex items-center justify-center gap-1 text-xs font-semibold text-violet-700 hover:text-violet-900">
            Lihat semua pesan <ChevronRight className="size-3.5" />
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
