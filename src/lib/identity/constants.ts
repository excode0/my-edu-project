export const institutionLevels = [
  "tk",
  "sd",
  "smp",
  "sma",
  "smk",
  "mi",
  "mts",
  "ma",
  "pt",
  "kursus",
  "lainnya",
] as const

export const institutionStatuses = ["negeri", "swasta"] as const

export const institutionLevelLabels: Record<string, string> = {
  tk: "TK / PAUD",
  sd: "SD",
  smp: "SMP",
  sma: "SMA",
  smk: "SMK",
  mi: "MI",
  mts: "MTs",
  ma: "MA",
  pt: "Perguruan tinggi",
  kursus: "Lembaga kursus",
  lainnya: "Lainnya",
}

export const institutionStatusLabels: Record<string, string> = {
  negeri: "Negeri",
  swasta: "Swasta",
}

export const socialMediaPlatforms = [
  { key: "instagram", label: "Instagram", placeholder: "@namaakun" },
  { key: "facebook", label: "Facebook", placeholder: "nama halaman" },
  { key: "youtube", label: "YouTube", placeholder: "@kanal atau tautan" },
  { key: "tiktok", label: "TikTok", placeholder: "@namaakun" },
  { key: "x", label: "X / Twitter", placeholder: "@namaakun" },
  { key: "linkedin", label: "LinkedIn", placeholder: "nama halaman" },
] as const

export function institutionLevelLabel(value: string) {
  return institutionLevelLabels[value] ?? value
}

export function institutionStatusLabel(value: string) {
  return institutionStatusLabels[value] ?? value
}
