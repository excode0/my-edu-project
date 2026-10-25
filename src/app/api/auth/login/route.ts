import { handleLogin } from "@/lib/auth/server/login"

export async function POST(request: Request) {
  return handleLogin(request)
}
