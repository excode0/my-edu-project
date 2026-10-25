import { handleLogin } from "@/features/auth/server/login"

export async function POST(request: Request) {
  return handleLogin(request)
}
