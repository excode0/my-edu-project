import "client-only"
import type { AdmissionSubmissionInput, AdmissionSubmissionResult } from "@/types/type-public-site-api"

export async function submitAdmission(input: AdmissionSubmissionInput) {
  const response = await fetch("/api/public/admissions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  const result = await response.json().catch(() => ({})) as Partial<AdmissionSubmissionResult> & { error?: string }
  if (!response.ok) throw new Error(result.error || "Pendaftaran belum dapat dikirim.")
  if (!result.referenceCode) throw new Error("Server tidak mengembalikan nomor referensi.")
  return result.referenceCode
}
