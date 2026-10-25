import { redirect } from "next/navigation"

export default async function CmsPage() {
  redirect("/dashboard/cms/collections")
}
