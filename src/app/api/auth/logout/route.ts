import { handleLogout } from "@/features/auth/server/logout"

export async function POST(request: Request) {
  return handleLogout(request)
}
