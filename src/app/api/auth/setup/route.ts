import { handleSetup } from "@/features/auth/server/setup"

export async function POST(request: Request) {
  return handleSetup(request)
}
