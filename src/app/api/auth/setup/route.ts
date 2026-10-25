import { handleSetup } from "@/lib/auth/server/setup"

export async function POST(request: Request) {
  return handleSetup(request)
}
