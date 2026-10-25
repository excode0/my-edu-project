import { ArrowUpRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function DashboardVisitsCard() {
  return (
    <Card className="border-0 bg-white shadow-sm shadow-slate-200/60">
      <CardHeader className="flex flex-row items-start justify-between gap-3 px-5 pt-5 sm:px-6">
        <div>
          <CardTitle className="text-base font-semibold">Kunjungan website</CardTitle>
          <p className="mt-1 text-sm text-slate-500">Minat pengunjung terhadap profil sekolah</p>
        </div>
        <span className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500">6 bulan</span>
      </CardHeader>
      <CardContent className="px-5 pb-5 sm:px-6">
        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500">Total kunjungan</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">2.840</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
            <ArrowUpRight className="size-3.5" />
            18,6% dari periode lalu
          </span>
        </div>
        <VisitsChart />
      </CardContent>
    </Card>
  )
}

function VisitsChart() {
  return (
    <div className="mt-5">
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-violet-600" />
          Kunjungan website
        </span>
      </div>
      <div className="mt-5 flex gap-3">
        <div className="flex h-44 flex-col justify-between pb-6 text-[10px] text-slate-400">
          <span>3.000</span>
          <span>2.250</span>
          <span>1.500</span>
          <span>750</span>
          <span>0</span>
        </div>
        <div className="relative min-w-0 flex-1">
          <div className="absolute inset-0 mb-6 flex flex-col justify-between" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((line) => (
              <div key={line} className="border-t border-dashed border-slate-200" />
            ))}
          </div>
          <svg
            viewBox="0 0 640 160"
            preserveAspectRatio="none"
            className="relative h-36 w-full overflow-visible"
            role="img"
            aria-label="Grafik kunjungan situs profil sekolah meningkat selama enam bulan terakhir"
          >
            <defs>
              <linearGradient id="visits-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#7c3aed" stopOpacity=".18" />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0 126 C45 118 55 100 107 106 S170 82 213 92 S277 59 320 69 S383 51 427 57 S490 34 533 43 S597 13 640 19 L640 160 L0 160Z"
              fill="url(#visits-fill)"
            />
            <path
              d="M0 126 C45 118 55 100 107 106 S170 82 213 92 S277 59 320 69 S383 51 427 57 S490 34 533 43 S597 13 640 19"
              fill="none"
              stroke="#7c3aed"
              strokeWidth="3"
              vectorEffect="non-scaling-stroke"
            />
            <circle cx="640" cy="19" r="4" fill="#7c3aed" />
          </svg>
          <div className="absolute inset-x-0 bottom-0 flex justify-between text-[10px] text-slate-400">
            {["Mei", "Jun", "Jul", "Agu", "Sep", "Okt"].map((month) => (
              <span key={month}>{month}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
