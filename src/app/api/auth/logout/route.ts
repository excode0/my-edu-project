import { handleLogout } from "@/lib/auth/server/logout"

export async function POST(request: Request) {
  return handleLogout(request)
}
