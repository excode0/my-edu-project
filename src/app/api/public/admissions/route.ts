import { submitAdmission } from "@/features/public-site/server/admissions"

export async function POST(request: Request) {
  return submitAdmission(request)
}
