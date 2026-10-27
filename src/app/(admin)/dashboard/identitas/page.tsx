import type { Metadata } from "next"
import { IdentityManager } from "@/components/dashboard/identity/identity-manager"
import { requireIdentityAccess } from "@/lib/identity/server/access"
import { loadIdentityData, loadIdentityMediaOptions } from "@/lib/identity/server/data"

export const metadata: Metadata = {
  title: "Identitas Lembaga",
}

export default async function IdentityPage() {
  await requireIdentityAccess()

  const [identity, media] = await Promise.all([
    loadIdentityData(),
    loadIdentityMediaOptions(),
  ])

  return <IdentityManager initialIdentity={identity} initialMedia={media} />
}
