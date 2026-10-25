import { UsersRound } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const settingsItems = [
  ["Navigasi & struktur halaman", "Kelola menu utama dan urutan halaman"],
  ["SEO & metadata", "Judul, deskripsi, dan berbagi sosial"],
  ["Domain & integrasi", "Domain sekolah dan layanan terhubung"],
]

const teamRoles = [
  ["Administrator", "Mengelola pengaturan dan seluruh konten", "1 pengguna"],
  ["Editor konten", "Membuat dan memperbarui publikasi", "2 pengguna"],
  ["Kontributor", "Mengirim draf berita dan kegiatan", "Pengembangan"],
]

export function DashboardSettingsTeam() {
  return (
    <section aria-label="Pengaturan dan tim" className="grid gap-5 md:grid-cols-2">
      <Card id="site-settings" className="border-0 bg-white shadow-sm shadow-slate-200/60">
        <CardHeader className="px-5 pt-5">
          <CardTitle className="text-base font-semibold">Struktur & konfigurasi situs</CardTitle>
          <p className="text-sm text-slate-500">Pengaturan teknis untuk mendukung pertumbuhan website.</p>
        </CardHeader>
        <CardContent className="space-y-3 px-5 pb-5">
          {settingsItems.map(([title, description]) => (
            <div key={title} className="flex items-start gap-3 rounded-lg border border-slate-100 p-3">
              <span className="mt-0.5 size-2 rounded-full bg-amber-400" />
              <div>
                <p className="text-xs font-semibold text-slate-800">{title}</p>
                <p className="mt-1 text-[11px] text-slate-500">{description}</p>
              </div>
              <span className="ml-auto rounded-full bg-slate-100 px-2 py-1 text-[10px] text-slate-500">Pengembangan</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card id="team" className="border-0 bg-white shadow-sm shadow-slate-200/60">
        <CardHeader className="px-5 pt-5">
          <CardTitle className="text-base font-semibold">Pengguna & peran</CardTitle>
          <p className="text-sm text-slate-500">Struktur akses yang siap untuk kolaborasi tim.</p>
        </CardHeader>
        <CardContent className="space-y-3 px-5 pb-5">
          {teamRoles.map(([role, description, count]) => (
            <div key={role} className="flex items-center gap-3 rounded-lg border border-slate-100 p-3">
              <div className="flex size-8 items-center justify-center rounded-full bg-violet-50 text-violet-700">
                <UsersRound className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-800">{role}</p>
                <p className="mt-1 text-[11px] text-slate-500">{description}</p>
              </div>
              <span className="shrink-0 text-[10px] text-slate-500">{count}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  )
}
