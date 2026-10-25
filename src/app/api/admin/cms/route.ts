import {
  getCmsRecords,
  mutateCmsRecord,
  removeCmsRecord,
} from "@/features/cms/server/handlers"

export async function GET() {
  return getCmsRecords()
}

export async function POST(request: Request) {
  return mutateCmsRecord(request, "POST")
}

export async function PATCH(request: Request) {
  return mutateCmsRecord(request, "PATCH")
}

export async function DELETE(request: Request) {
  return removeCmsRecord(request)
}
