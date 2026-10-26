import type { Metadata } from "next"
import { LoginScreen } from "@/components/auth/login-screen"

export const metadata: Metadata = {
  title: "Masuk ke dashboard | Panel Sekolah",
  description: "Masuk ke dashboard manajemen website sekolah.",
}

export default function LoginPage() {
  return (
    <LoginScreen
      schoolName="SMA Cendekia Nusantara"
      location="Bandung, Jawa Barat"
    />
  )
}
