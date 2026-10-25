import { redirect } from "next/navigation"

const valid = ["identity", "users", "collections", "items", "submissions", "pages", "media", "templates", "template-config", "navigation", "settings", "audit"]

export default async function ModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params
  if (!valid.includes(module)) redirect("/dashboard/cms")
  redirect(`/dashboard/cms/${module}`)
}
