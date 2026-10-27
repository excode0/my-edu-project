INSERT INTO collections (
  slug, nama, deskripsi, kind, mode, has_public_detail, url_prefix, sort_order, is_active
) VALUES (
  'staff', 'Staff', 'Menyimpan data pimpinan, guru, dosen, dan staf pengelola.',
  'dynamic', 'content', true, '/staff', 2, true
)
ON CONFLICT (slug) DO UPDATE SET
  nama = EXCLUDED.nama,
  deskripsi = EXCLUDED.deskripsi,
  kind = EXCLUDED.kind,
  mode = EXCLUDED.mode,
  has_public_detail = EXCLUDED.has_public_detail,
  url_prefix = EXCLUDED.url_prefix,
  sort_order = EXCLUDED.sort_order,
  is_active = true,
  deleted_at = NULL;

INSERT INTO collection_fields (
  collection_id, key, label, field_type, is_required, is_unique,
  is_searchable, is_filterable, is_listed, validation, help_text, sort_order
)
SELECT
  c.id, f.key, f.label, f.field_type::field_type, f.is_required, f.is_unique,
  f.is_searchable, f.is_filterable, f.is_listed, f.validation, f.help_text, f.sort_order
FROM collections c
JOIN (VALUES
  ('name', 'Nama lengkap', 'text', true, false, true, false, true, '{"min":3,"max":120}'::jsonb, 'Nama lengkap beserta gelar.', 1),
  ('nip', 'NIP / NIDN', 'text', true, true, true, false, true, '{"max":50}'::jsonb, 'NIP, NIDN, atau NIK pegawai.', 2),
  ('position', 'Jabatan', 'text', true, false, false, true, true, '{"max":56}'::jsonb, null, 3),
  ('photo', 'Foto', 'media', false, false, false, false, true, '{}'::jsonb, 'Foto profil staf.', 4),
  ('bio', 'Biografi', 'textarea', false, false, false, false, true, '{}'::jsonb, 'Profil singkat, pendidikan, atau bidang keahlian.', 5)
) AS f(key, label, field_type, is_required, is_unique, is_searchable, is_filterable, is_listed, validation, help_text, sort_order)
  ON c.slug = 'staff'
ON CONFLICT (collection_id, key) DO UPDATE SET
  label = EXCLUDED.label,
  field_type = EXCLUDED.field_type,
  is_required = EXCLUDED.is_required,
  is_unique = EXCLUDED.is_unique,
  is_searchable = EXCLUDED.is_searchable,
  is_filterable = EXCLUDED.is_filterable,
  is_listed = EXCLUDED.is_listed,
  validation = EXCLUDED.validation,
  help_text = EXCLUDED.help_text,
  sort_order = EXCLUDED.sort_order;
