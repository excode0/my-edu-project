import type { Metadata } from "next"
import { PublicContentPage } from "@/features/public-site/components/public-content-page"
import { getPublicRoute } from "@/features/public-site/server/data"

type PublicContentProps = {
  params: Promise<{ path: string[] }>
}

export async function generateMetadata({ params }: PublicContentProps): Promise<Metadata> {
  const { path } = await params
  const route = await getPublicRoute(`/${path.join("/")}`)
  return route ? { title: route.title, description: route.description || undefined } : {}
}

export default function Page({ params }: PublicContentProps) {
  return <PublicContentPage params={params} />
}
