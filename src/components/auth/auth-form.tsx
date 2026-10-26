"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { CircleAlert, Eye, EyeOff, KeyRound, Lock, LogIn, Mail, UserRoundPlus } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import { submitAuthentication } from "@/lib/auth/client/api"

export function AuthForm({ setup = false }: { setup?: boolean }) {
  const router = useRouter()
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setBusy(true)
    const formData = new FormData(event.currentTarget)
    try {
      await submitAuthentication({
        setup,
        name: String(formData.get("name") ?? ""),
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
      })
      router.replace("/dashboard")
      router.refresh()
    } catch (submitError) {
      setError(submitError instanceof Error
        ? submitError.message
        : "Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <FieldGroup className="gap-4">
        {setup && (
          <Field>
            <FieldLabel htmlFor="name">Nama administrator</FieldLabel>
            <InputGroup className="h-10">
              <InputGroupAddon>
                <UserRoundPlus />
              </InputGroupAddon>
              <InputGroupInput
                id="name"
                name="name"
                required
                minLength={2}
                maxLength={120}
                autoComplete="name"
                autoFocus
                placeholder="Nama lengkap"
                className="h-full"
                suppressHydrationWarning
              />
            </InputGroup>
          </Field>
        )}
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <InputGroup className="h-10">
            <InputGroupAddon>
              <Mail />
            </InputGroupAddon>
            <InputGroupInput
              id="email"
              name="email"
              type="email"
              required
              maxLength={180}
              autoComplete="email"
              autoFocus={!setup}
              placeholder="nama@sekolah.sch.id"
              className="h-full"
              suppressHydrationWarning
            />
          </InputGroup>
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <InputGroup className="h-10">
            <InputGroupAddon>
              <Lock />
            </InputGroupAddon>
            <InputGroupInput
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={setup ? 12 : 1}
              maxLength={128}
              autoComplete={setup ? "new-password" : "current-password"}
              placeholder={setup ? "Buat password yang kuat" : "Masukkan password"}
              className="h-full"
              suppressHydrationWarning
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-sm"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                aria-pressed={showPassword}
                className="text-muted-foreground hover:text-foreground"
                suppressHydrationWarning
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          {setup && (
            <FieldDescription>Gunakan minimal 12 karakter agar akun lebih aman.</FieldDescription>
          )}
        </Field>
      </FieldGroup>

      {error && (
        <Alert variant="destructive" className="bg-destructive/5">
          <CircleAlert />
          <AlertTitle>Tidak dapat masuk</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-4">
        <Button
          type="submit"
          size="lg"
          disabled={busy}
          className="h-10 w-full"
          suppressHydrationWarning
        >
          {busy ? (
            <>
              <Spinner /> Memproses...
            </>
          ) : setup ? (
            <>
              <UserRoundPlus /> Buat administrator
            </>
          ) : (
            <>
              <LogIn /> Masuk ke dashboard
            </>
          )}
        </Button>

        {!setup && (
          <>
            <FieldSeparator>atau</FieldSeparator>
            <Button
              variant="outline"
              size="lg"
              className="h-10 w-full"
              nativeButton={false}
              suppressHydrationWarning
              render={
                <Link href="/setup">
                  <KeyRound /> Setup administrator pertama
                </Link>
              }
            />
          </>
        )}
      </div>
    </form>
  )
}
