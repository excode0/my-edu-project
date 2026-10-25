INSERT INTO roles (slug, name, description, is_system) VALUES
  ('superadmin', 'Superadmin', 'Akses penuh ke seluruh sistem.', true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO site_identities (
  singleton_key, nama_lembaga, nama_singkat, jenjang, status_lembaga,
  akreditasi, visi, alamat, kota, provinsi, telepon, email
) VALUES (
  'main', 'Nama Lembaga', 'Lembaga', 'sma', 'swasta',
  '', '', '', '', '', '', ''
) ON CONFLICT (singleton_key) DO NOTHING;

INSERT INTO collections (slug, nama, deskripsi, kind, mode, has_public_detail, url_prefix, sort_order, is_active)
VALUES ('berita', 'Berita', 'Konten untuk fitur berita.', 'dynamic', 'content', true, '/berita', 1, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO collection_fields (
  collection_id, key, label, field_type, is_required, is_searchable, is_filterable,
  is_listed, sort_order, validation, options, help_text
)
SELECT c.id, f.key, f.label, f.field_type::field_type, f.is_required, f.is_searchable,
  f.is_filterable, f.is_listed, f.sort_order, f.validation, f.options, f.help_text
FROM collections c
JOIN (VALUES
  ('judul', 'Judul', 'text', true, true, false, true, 1, '{"max":120}'::jsonb, null::jsonb, 'Judul berita yang tampil di halaman publik.'),
  ('ringkasan', 'Ringkasan', 'textarea', false, true, false, true, 2, '{"max":300}'::jsonb, null::jsonb, 'Ringkasan pendek untuk daftar berita.'),
  ('isi', 'Isi berita', 'richtext', true, false, false, false, 3, '{}'::jsonb, null::jsonb, 'Isi utama berita.'),
  ('kategori', 'Kategori', 'select', true, true, true, true, 4, '{}'::jsonb, '["Akademik","Kegiatan sekolah","Prestasi","Pengumuman"]'::jsonb, 'Pilih kategori berita.'),
  ('tanggal_terbit', 'Tanggal terbit', 'date', true, true, true, true, 5, '{}'::jsonb, null::jsonb, null),
  ('penulis', 'Penulis', 'text', false, false, false, true, 6, '{"max":120}'::jsonb, null::jsonb, null)
) AS f(key, label, field_type, is_required, is_searchable, is_filterable, is_listed, sort_order, validation, options, help_text)
  ON c.slug = 'berita'
ON CONFLICT (collection_id, key) DO NOTHING;

INSERT INTO menus (key, nama, location) VALUES ('main', 'Menu utama', 'header')
ON CONFLICT (key) DO NOTHING;

INSERT INTO menu_items (menu_id, label, link_type, collection_id, sort_order)
SELECT m.id, 'Berita', 'collection', c.id, 1
FROM menus m CROSS JOIN collections c
WHERE m.key = 'main' AND c.slug = 'berita'
ON CONFLICT DO NOTHING;

INSERT INTO settings ("group", key, value, is_secret) VALUES
  ('general', 'site_title', '"Nama Lembaga"'::jsonb, false),
  ('general', 'site_description', '"Situs resmi lembaga."'::jsonb, false),
  ('admissions', 'status', '"Pendaftaran belum dibuka"'::jsonb, false),
  ('admissions', 'enabled', 'false'::jsonb, false)
ON CONFLICT ("group", key) DO NOTHING;
