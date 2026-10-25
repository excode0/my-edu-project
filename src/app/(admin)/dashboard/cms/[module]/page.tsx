import { redirect } from "next/navigation"

const valid = ["collections", "news"]

export default async function ModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params
  if (!valid.includes(module)) redirect("/dashboard/cms/collections")
  redirect(`/dashboard/cms/${module}`)
}
