import { randomBytes } from "node:crypto"
import { NextResponse } from "next/server"
import { z } from "zod"
import { hashPrivateIdentifier } from "@/features/auth/server/auth"
import { db } from "@/lib/db"
import { validateSubmission, type SubmissionField } from "./admission-validation"

const submissionSchema = z.object({
  data: z.record(z.string(), z.union([
    z.string().max(2_000),
    z.array(z.string().max(2_000)).max(50),
  ])),
  privacyConsent: z.literal(true),
  website: z.string().max(200).optional(),
}).strict()

function invalid(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

async function consumeRateLimit(identifierHash: string) {
  const result = await db.query<{ attempts: number; blocked_until: Date | null }>(
    `INSERT INTO public_form_attempts (identifier_hash, attempts)
     VALUES ($1, 1)
     ON CONFLICT (identifier_hash) DO UPDATE SET
       attempts = CASE
         WHEN public_form_attempts.window_started_at <= now() - interval '15 minutes' THEN 1
         ELSE public_form_attempts.attempts + 1
       END,
       window_started_at = CASE
         WHEN public_form_attempts.window_started_at <= now() - interval '15 minutes' THEN now()
         ELSE public_form_attempts.window_started_at
       END,
       blocked_until = CASE
         WHEN public_form_attempts.blocked_until > now() THEN public_form_attempts.blocked_until
         WHEN public_form_attempts.window_started_at <= now() - interval '15 minutes' THEN NULL
         WHEN public_form_attempts.attempts >= 5 THEN now() + interval '15 minutes'
         ELSE NULL
       END
     RETURNING attempts, blocked_until`,
    [identifierHash],
  )
  const row = result.rows[0]
  if (row?.blocked_until && new Date(row.blocked_until).getTime() > Date.now()) {
    throw new Error("RATE_LIMITED")
  }
}

export async function submitAdmission(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return invalid("Isi permintaan tidak valid.")
  }

  const parsed = submissionSchema.safeParse(body)
  if (!parsed.success) return invalid("Periksa isian wajib dan persetujuan privasi.")
  if (parsed.data.website?.trim()) return invalid("Permintaan pendaftaran tidak valid.")

  try {
    const [settingResult, collectionResult] = await Promise.all([
      db.query<{ value: unknown }>(
        `SELECT value FROM settings WHERE "group" = 'admissions' AND key = 'enabled' LIMIT 1`,
      ),
      db.query<{ id: string; is_active: boolean; mode: string }>(
        `SELECT id, is_active, mode FROM collections
         WHERE slug = 'ppdb' AND deleted_at IS NULL LIMIT 1`,
      ),
    ])
    const collection = collectionResult.rows[0]
    if (settingResult.rows[0]?.value !== true || !collection?.is_active || collection.mode !== "form") {
      return invalid("Pendaftaran saat ini belum dibuka.", 403)
    }

    const fieldResult = await db.query<SubmissionField>(
      `SELECT key, label, field_type, is_required, options, validation
       FROM collection_fields WHERE collection_id = $1 ORDER BY sort_order, label`,
      [collection.id],
    )
    const validated = validateSubmission(parsed.data.data, fieldResult.rows)
    if ("error" in validated) return invalid(validated.error)

    const email = validated.email.trim().toLowerCase()
    const forwardedAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? request.headers.get("x-real-ip")?.trim()
      ?? "unknown"
    const ipHash = hashPrivateIdentifier("public-admission-ip", forwardedAddress)
    await consumeRateLimit(hashPrivateIdentifier("public-admission-email", email))
    await consumeRateLimit(ipHash)

    const phoneValue = validated.data.telepon
    const phone = typeof phoneValue === "string" ? phoneValue || null : null
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const referenceCode = `PPDB-${new Date().toISOString().slice(0, 7).replace("-", "")}-${randomBytes(4).toString("hex").toUpperCase()}`
      const inserted = await db.query(
        `INSERT INTO form_submissions
          (collection_id, reference_code, data, contact_email, contact_phone, ip_hash, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (reference_code) DO NOTHING
         RETURNING id`,
        [
          collection.id,
          referenceCode,
          JSON.stringify({ ...validated.data, privacy_consent: true }),
          email,
          phone,
          ipHash,
          request.headers.get("user-agent")?.slice(0, 255) ?? null,
        ],
      )
      if (inserted.rowCount) return NextResponse.json({ referenceCode }, { status: 201 })
    }
    throw new Error("Unable to allocate a unique admission reference.")
  } catch (error) {
    if (error instanceof Error && error.message === "RATE_LIMITED") {
      return invalid("Terlalu banyak percobaan. Silakan coba kembali dalam 15 menit.", 429)
    }
    console.error("Public admission submission failed.", error)
    return invalid("Pendaftaran gagal disimpan. Silakan coba lagi nanti.", 500)
  }
}
