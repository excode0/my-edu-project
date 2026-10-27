import type { Metadata } from "next"
import { MediaManager } from "@/components/dashboard/media/media-manager"
import { requireCmsModuleAccess } from "@/lib/cms/server/pages/access"
import { loadMediaLibrary } from "@/lib/media/server/data"

export const metadata: Metadata = {
  title: "Media",
}

export default async function MediaPage() {
  await requireCmsModuleAccess("media")

  const initialData = await loadMediaLibrary()

  return <MediaManager initialData={initialData} />
}
