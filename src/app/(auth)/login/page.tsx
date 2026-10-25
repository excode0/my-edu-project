import { AuthForm } from "@/features/auth/components/auth-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Panel sekolah</p>
          <CardTitle className="text-2xl">Masuk ke dashboard</CardTitle>
          <CardDescription>Gunakan akun administrator atau editor yang telah dibuat.</CardDescription>
        </CardHeader>
        <CardContent>
          <AuthForm />
        </CardContent>
      </Card>
    </main>
  )
}
