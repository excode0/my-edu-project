CREATE TABLE public_form_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier_hash char(64) NOT NULL UNIQUE,
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  window_started_at timestamptz NOT NULL DEFAULT now(),
  blocked_until timestamptz
);
