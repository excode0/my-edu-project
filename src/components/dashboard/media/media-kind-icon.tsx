import { File, FileText, Film, ImageIcon, Music2 } from "lucide-react"
import type { MediaKind } from "@/types/type-media"

export function MediaKindIcon({ kind, className }: { kind: MediaKind; className?: string }) {
  if (kind === "document") return <FileText className={className} />
  if (kind === "video") return <Film className={className} />
  if (kind === "audio") return <Music2 className={className} />
  if (kind === "other") return <File className={className} />
  return <ImageIcon className={className} />
}
