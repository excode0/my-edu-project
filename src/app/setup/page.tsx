import { Suspense } from "react"
import { redirect } from "next/navigation"
import { AuthForm } from "@/app/login/auth-form"
import { db } from "@/lib/db"

export default function SetupPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">Memeriksa status setup...</main>}>
      <SetupContent />
    </Suspense>
  )
}

async function SetupContent() {
  const result = await db.query<{ exists: boolean }>("SELECT EXISTS (SELECT 1 FROM users) AS exists")
  if (result.rows[0]?.exists) redirect("/login")

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-700">Setup pertama</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Buat administrator</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">Halaman ini hanya aktif sebelum akun pertama dibuat. Password disimpan sebagai hash dan tidak dapat dipulihkan dari database.</p>
        <AuthForm setup />
      </section>
    </main>
  )
}
