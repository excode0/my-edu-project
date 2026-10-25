import { submitAdmission } from "@/lib/public-site/server/admissions"

export async function POST(request: Request) {
  return submitAdmission(request)
}
