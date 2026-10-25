import { uploadMedia } from "@/features/cms/server/media-upload"

export async function POST(request: Request) {
  return uploadMedia(request)
}
