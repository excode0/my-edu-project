export type AdmissionSubmissionInput = {
  data: Record<string, string | string[]>
  privacyConsent: boolean
  website: string
}

export type AdmissionSubmissionResult = { referenceCode: string }
