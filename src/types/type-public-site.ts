export type AdmissionField = {
  key: string
  label: string
  field_type: string
  is_required: boolean
  options: unknown
  help_text: string | null
}

export type SubmissionField = Omit<AdmissionField, "help_text"> & {
  validation: Record<string, unknown>
}

export type SubmissionValidation =
  | { error: string }
  | { data: Record<string, string | string[]>; email: string }

