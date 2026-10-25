import Link from "next/link"
import { CalendarDays, Mail, MapPin, Phone, School } from "lucide-react"

export function HomeFooter({
  schoolName,
  shortName,
  vision,
  address,
  phone,
  email,
}: {
  schoolName: string
  shortName: string
  vision: string
  address: string
  phone: string
  email: string
}) {
  const currentYear = new Date().getFullYear()

  return (
    <footer id="kontak" className="scroll-mt-24 bg-slate-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1fr_auto]">
        <div>
          <Link href="/" className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-violet-600"><School className="size-5" /></span>
            <span className="text-sm font-semibold">{shortName}</span>
          </Link>
          <p className="mt-4 max-w-md text-sm leading-6 text-slate-400">{vision || `Profil ${schoolName} yang berkomitmen mendampingi siswa menjadi pembelajar sepanjang hayat.`}</p>
        </div>
        <div className="space-y-3 text-sm text-slate-300">
          <p className="font-semibold text-white">Hubungi sekolah</p>
          <p className="flex items-center gap-2"><MapPin className="size-4 text-violet-300" /> {address}</p>
          <p className="flex items-center gap-2"><Phone className="size-4 text-violet-300" /> {phone}</p>
          {email && <p className="flex items-center gap-2"><Mail className="size-4 text-violet-300" /> {email}</p>}
          <p className="flex items-center gap-2"><CalendarDays className="size-4 text-violet-300" /> Senin–Jumat, 08.00–15.00</p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-2 px-5 py-4 text-[11px] text-slate-500 sm:px-8">
          <span>© {currentYear} {schoolName}. Seluruh hak cipta dilindungi.</span>
          <Link href="/dashboard" className="hover:text-white">Panel pengelola</Link>
        </div>
      </div>
    </footer>
  )
}
