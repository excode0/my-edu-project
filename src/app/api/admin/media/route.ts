import { uploadMedia } from "@/lib/cms/server/operations/media-upload"

export async function POST(request: Request) {
  return uploadMedia(request)
}
