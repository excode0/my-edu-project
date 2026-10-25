import { Suspense } from "react"
import { redirect } from "next/navigation"
import { AuthForm } from "@/components/auth/auth-form"
import { db } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SetupPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-background px-4">Memeriksa status setup...</main>}>
      <SetupContent />
    </Suspense>
  )
}

async function SetupContent() {
  const result = await db.query<{ exists: boolean }>("SELECT EXISTS (SELECT 1 FROM users) AS exists")
  if (result.rows[0]?.exists) redirect("/login")

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Setup pertama</p>
          <CardTitle className="text-2xl">Buat administrator</CardTitle>
          <CardDescription>Halaman ini hanya aktif sebelum akun pertama dibuat. Password disimpan sebagai hash.</CardDescription>
        </CardHeader>
        <CardContent>
          <AuthForm setup />
        </CardContent>
      </Card>
    </main>
  )
}
