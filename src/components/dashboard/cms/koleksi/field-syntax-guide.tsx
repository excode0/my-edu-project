"use client"

import { BookOpenCheck, CircleHelp, Info } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"

const parts = [
  {
    token: "key",
    badge: "wajib",
    title: "Nama field",
    description:
      "Harus unik. Gunakan huruf, angka, atau underscore, diawali huruf, maksimal 80 karakter. Label tampil dibuat otomatis dari key.",
  },
  {
    token: ":type",
    badge: "opsional",
    title: "Tipe data",
    description:
      "Menentukan kontrol input yang dipakai. Jika dihilangkan, tipe default adalah text.",
  },
  {
    token: "[opsi1|opsi2]",
    badge: "khusus pilihan",
    title: "Daftar opsi",
    description:
      "Hanya untuk select dan multiselect. Pisahkan opsi dengan tanda |, maksimal 50 opsi unik, 120 karakter per opsi.",
  },
  {
    token: "!",
    badge: "opsional",
    title: "Wajib diisi",
    description:
      "Letakkan di akhir setelah tipe atau daftar opsi. Field dengan tanda ini harus diisi sebelum disimpan.",
  },
]

const fieldTypes = [
  { type: "text", description: "Teks singkat satu baris" },
  { type: "textarea", description: "Teks panjang beberapa baris" },
  { type: "richtext", description: "Teks berformat dengan editor" },
  { type: "number", description: "Angka atau nominal" },
  { type: "boolean", description: "Centang ya / tidak" },
  { type: "date", description: "Tanggal" },
  { type: "datetime", description: "Tanggal dan waktu" },
  { type: "select", description: "Satu pilihan dari daftar opsi" },
  { type: "multiselect", description: "Banyak pilihan dari daftar opsi" },
  { type: "url", description: "Alamat tautan" },
  { type: "email", description: "Alamat email" },
  { type: "phone", description: "Nomor telepon" },
  { type: "media", description: "Satu item dari pustaka media" },
  { type: "media_multiple", description: "Beberapa item media" },
  { type: "relation", description: "Referensi ke data lain" },
  { type: "json", description: "Data JSON terstruktur" },
]

const examples = [
  {
    label: "Pilihan tunggal yang wajib diisi",
    syntax: "kategori:select[Akademik|Prestasi|Ekstrakurikuler]!",
  },
  {
    label: "Pilihan ganda",
    syntax: "minat:multiselect[Musik|Olahraga|Seni]",
  },
  {
    label: "Beberapa field sekaligus",
    syntax: "tanggal_terbit:date!, penulis:text!, jumlah_siswa:number",
  },
]

export function FieldSyntaxGuide() {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="h-6 gap-1 rounded-full px-2 text-[11px] font-medium text-violet-700 hover:bg-violet-100 hover:text-violet-800"
          >
            <CircleHelp className="size-3.5" /> Panduan format
          </Button>
        }
      />
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader className="pr-8">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              <BookOpenCheck className="size-5" />
            </span>
            <div className="space-y-1">
              <DialogTitle>Panduan format field koleksi</DialogTitle>
              <DialogDescription>
                Susun struktur data koleksi dengan sintaks ringkas. Setiap field dipisahkan dengan koma.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-700">
            Struktur dasar
          </p>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-950 px-4 py-3 font-mono text-[12px] text-violet-100">
            <code>key:type[opsi1|opsi2]!</code>
          </pre>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            Tanda <code className="font-mono text-violet-700">:</code> memisahkan key dan tipe,
            kurung siku berisi opsi untuk field pilihan, dan <code className="font-mono text-violet-700">!</code> menandai
            field wajib. Hanya key yang benar-benar wajib ditulis.
          </p>
        </div>

        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Bagian format
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {parts.map((part) => (
              <div
                key={part.token}
                className="rounded-lg border border-slate-200 bg-slate-50/70 p-3"
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <code className="rounded bg-slate-900 px-1.5 py-0.5 font-mono text-[11px] text-white">
                    {part.token}
                  </code>
                  <span className="text-xs font-semibold text-slate-800">{part.title}</span>
                  <Badge variant="outline" className="ml-auto text-[10px] text-slate-500">
                    {part.badge}
                  </Badge>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                  {part.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <Separator />

        <section className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Tipe field yang didukung
            </h3>
            <Badge variant="secondary">{fieldTypes.length} tipe</Badge>
          </div>
          <div className="grid gap-x-6 sm:grid-cols-2">
            {fieldTypes.map(({ type, description }) => (
              <div
                key={type}
                className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 border-b border-slate-100 py-1.5 last:border-0"
              >
                <code className="font-mono text-[11px] font-medium text-violet-700">{type}</code>
                <span className="text-xs text-slate-600">{description}</span>
              </div>
            ))}
          </div>
        </section>

        <Separator />

        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Contoh siap pakai
          </h3>
          <div className="space-y-2">
            {examples.map((example) => (
              <div
                key={example.syntax}
                className="rounded-lg border border-slate-200 bg-white p-2.5"
              >
                <p className="text-[11px] font-medium text-slate-500">{example.label}</p>
                <code className="mt-1 block break-words font-mono text-[11px] leading-5 text-violet-800">
                  {example.syntax}
                </code>
              </div>
            ))}
          </div>
        </section>

        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-800">
            <Info className="size-4" /> Catatan penting
          </div>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-relaxed text-amber-900/80">
            <li>Pisahkan antar field dengan koma. Jangan memakai koma di dalam opsi.</li>
            <li>Key field tidak boleh berulang dalam satu koleksi.</li>
            <li>Opsi tidak boleh mengandung koma, tanda |, atau kurung siku.</li>
            <li>Opsi hanya berlaku untuk tipe select dan multiselect.</li>
            <li>
              Tanda <code className="font-mono">!</code> diletakkan di akhir tipe, bukan setelah
              setiap opsi.
            </li>
          </ul>
        </div>

        <DialogFooter>
          <DialogClose render={<Button type="button" />}>Mengerti</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
