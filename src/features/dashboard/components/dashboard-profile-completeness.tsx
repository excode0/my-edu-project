import { Check } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function DashboardProfileCompleteness() {
  return (
    <Card className="border-0 bg-white shadow-sm shadow-slate-200/60">
      <CardHeader className="px-5 pt-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Kelengkapan profil</CardTitle>
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">Perlu ditinjau</span>
        </div>
        <p className="text-sm text-slate-500">Informasi yang tampil di website publik</p>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="mt-4 flex items-center gap-4">
          <div className="relative flex size-[76px] shrink-0 items-center justify-center rounded-full" style={{ background: "conic-gradient(#7c3aed 0% 82%, #ede9fe 82% 100%)" }}>
            <div className="flex size-[58px] items-center justify-center rounded-full bg-white text-lg font-semibold text-slate-900">82%</div>
          </div>
          <p className="text-sm leading-relaxed text-slate-600">Profil sekolah sudah cukup lengkap. Tambahkan beberapa informasi untuk membangun kepercayaan calon siswa dan orang tua.</p>
        </div>
        <div className="mt-5 space-y-3">
          {[
            { label: "Identitas & kontak sekolah", done: true },
            { label: "Program pendidikan", done: true },
            { label: "Profil tenaga pendidik", done: false },
            { label: "Foto fasilitas & lingkungan", done: false },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2.5 text-xs">
              <span className={`flex size-4 items-center justify-center rounded-full ${item.done ? "bg-emerald-100 text-emerald-700" : "border border-slate-300 text-transparent"}`}>
                <Check className="size-3" />
              </span>
              <span className={item.done ? "text-slate-600" : "text-slate-500"}>{item.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
