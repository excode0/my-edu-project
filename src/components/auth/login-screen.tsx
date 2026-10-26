import { Suspense } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  History,
  LayoutDashboard,
  School,
  ShieldCheck,
} from "lucide-react"
import { AuthForm } from "@/components/auth/auth-form"
import { CurrentYear } from "@/components/auth/current-year"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Kbd } from "@/components/ui/kbd"
import { Separator } from "@/components/ui/separator"

const highlights = [
  {
    icon: ShieldCheck,
    title: "Akses berbasis peran",
    description: "Setiap staf hanya melihat menu sesuai izinnya.",
  },
  {
    icon: LayoutDashboard,
    title: "Konten terpusat",
    description: "Berita, halaman, media, dan PPDB dalam satu panel.",
  },
  {
    icon: History,
    title: "Jejak aktivitas",
    description: "Perubahan penting tercatat rapi di audit log.",
  },
]

export function LoginScreen({
  schoolName,
  location,
}: {
  schoolName: string
  location: string
}) {
  return (
    <main className="grid min-h-screen bg-slate-50 lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-violet-800 via-violet-700 to-indigo-950 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-1/4 size-80 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -right-20 -top-24 size-96 rounded-full border border-white/10" />
          <div className="absolute -right-28 -top-32 size-[30rem] rounded-full border border-white/10" />
          <div className="absolute bottom-0 left-1/3 size-72 rounded-full bg-indigo-400/20 blur-3xl" />
        </div>

        <Link href="/" className="relative inline-flex w-fit items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur">
            <School className="size-5" />
          </span>
          <span>
            <span className="block text-sm font-bold tracking-tight">{schoolName}</span>
            <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200">
              {location}
            </span>
          </span>
        </Link>

        <div className="relative max-w-md">
          <Badge className="border border-white/15 bg-white/10 text-violet-100 backdrop-blur">
            Panel manajemen sekolah
          </Badge>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.15] tracking-tight xl:text-[42px]">
            Satu tempat untuk mengelola website sekolah.
          </h1>
          <p className="mt-4 text-sm leading-6 text-violet-100/80">
            Perbarui profil, berita, halaman, dan penerimaan siswa baru tanpa menyentuh kode.
          </p>

          <ItemGroup className="mt-8 gap-3">
            {highlights.map(({ icon: Icon, title, description }) => (
              <Item
                key={title}
                className="border-white/10 bg-white/5 p-3.5 backdrop-blur-sm"
              >
                <ItemMedia
                  variant="icon"
                  className="size-9 rounded-lg border-white/15 bg-white/10 text-violet-100"
                >
                  <Icon />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle className="text-white">{title}</ItemTitle>
                  <ItemDescription className="text-violet-100/75">
                    {description}
                  </ItemDescription>
                </ItemContent>
              </Item>
            ))}
          </ItemGroup>
        </div>

        <div className="relative space-y-4">
          <Separator className="bg-white/15" />
          <div className="flex flex-col gap-2 text-xs text-violet-100/70 sm:flex-row sm:items-center sm:justify-between">
            <p>
              &copy; <Suspense fallback="2026"><CurrentYear /></Suspense> {schoolName}
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 font-medium text-white/90 transition hover:text-white"
              target="_blank"
            >
              Lihat website <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="relative flex items-center justify-center overflow-hidden px-4 py-10 sm:px-8 lg:px-10">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 right-0 size-80 rounded-full bg-violet-200/40 blur-3xl" />
          <div className="absolute -bottom-40 -left-24 size-96 rounded-full bg-indigo-100/60 blur-3xl" />
        </div>

        <div className="relative w-full max-w-md">
          <Link href="/" className="mb-6 flex items-center gap-3 lg:hidden">
            <span className="flex size-10 items-center justify-center rounded-xl bg-violet-700 text-white shadow-sm shadow-violet-300">
              <School className="size-5" />
            </span>
            <span>
              <span className="block text-sm font-bold tracking-tight">{schoolName}</span>
              <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                {location}
              </span>
            </span>
          </Link>

          <Card className="w-full border-0 shadow-2xl shadow-violet-950/10 ring-1 ring-slate-200/80">
            <CardHeader className="gap-3">
              <div className="flex items-start justify-between gap-4">
                <Badge variant="secondary" className="gap-1.5 bg-violet-50 text-violet-700">
                  <ShieldCheck /> Panel sekolah
                </Badge>
                <span className="hidden size-11 items-center justify-center rounded-xl bg-violet-700 text-white shadow-sm shadow-violet-300 lg:flex">
                  <School className="size-5" />
                </span>
              </div>
              <div className="space-y-1.5">
                <CardTitle className="text-2xl tracking-tight">Masuk ke dashboard</CardTitle>
                <CardDescription>
                  Gunakan akun administrator atau editor yang sudah terdaftar.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <AuthForm />
            </CardContent>
            <CardFooter className="flex-col items-stretch gap-3 bg-slate-50/80">
              <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                Tekan <Kbd>Enter</Kbd> untuk masuk
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-slate-500 hover:text-slate-900"
                nativeButton={false}
                suppressHydrationWarning
                render={
                  <Link href="/">
                    <ArrowLeft /> Kembali ke website sekolah
                  </Link>
                }
              />
            </CardFooter>
          </Card>
        </div>
      </section>
    </main>
  )
}
