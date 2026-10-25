import { AuthForm } from "./auth-form"

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-700">Panel sekolah</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Masuk ke dashboard</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">Gunakan akun administrator atau editor yang telah dibuat.</p>
        <AuthForm />
      </section>
    </main>
  )
}
