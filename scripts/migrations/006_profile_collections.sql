INSERT INTO collections (
  slug, nama, deskripsi, kind, mode, has_public_detail, url_prefix, sort_order, is_active
) VALUES
  ('program', 'Program', 'Program pembelajaran dan kegiatan unggulan lembaga.', 'dynamic', 'content', true, '/program', 3, true),
  ('ekstrakurikuler', 'Ekstrakurikuler', 'Kegiatan pengembangan minat, bakat, dan organisasi siswa.', 'dynamic', 'content', true, '/ekstrakurikuler', 4, true),
  ('fasilitas', 'Fasilitas', 'Sarana dan prasarana yang tersedia untuk kegiatan belajar.', 'dynamic', 'content', true, '/fasilitas', 5, true),
  ('prestasi', 'Prestasi', 'Capaian siswa, guru, dan lembaga pada berbagai tingkat.', 'dynamic', 'content', true, '/prestasi', 6, true)
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
  is_searchable, is_filterable, is_listed, validation, options, help_text, sort_order
)
SELECT
  c.id, f.key, f.label, f.field_type::field_type, f.is_required, f.is_unique,
  f.is_searchable, f.is_filterable, f.is_listed, f.validation, f.options, f.help_text, f.sort_order
FROM collections c
JOIN (VALUES
  ('program', 'judul', 'Judul program', 'text', true, false, true, false, true, '{"max":120}'::jsonb, null::jsonb, 'Nama program yang tampil di halaman publik.', 1),
  ('program', 'ringkasan', 'Ringkasan', 'textarea', true, false, true, false, true, '{"max":300}'::jsonb, null::jsonb, 'Ringkasan singkat untuk daftar program.', 2),
  ('program', 'isi', 'Deskripsi program', 'richtext', false, false, false, false, false, '{}'::jsonb, null::jsonb, 'Penjelasan lengkap program.', 3),
  ('program', 'foto', 'Foto program', 'media', false, false, false, false, false, '{}'::jsonb, null::jsonb, 'Foto utama program.', 4),
  ('program', 'durasi', 'Durasi', 'text', false, false, false, false, true, '{"max":80}'::jsonb, null::jsonb, 'Contoh: 3 tahun atau 2 semester.', 5),

  ('ekstrakurikuler', 'nama', 'Nama ekstrakurikuler', 'text', true, false, true, false, true, '{"max":120}'::jsonb, null::jsonb, 'Nama kegiatan ekstrakurikuler.', 1),
  ('ekstrakurikuler', 'deskripsi', 'Deskripsi', 'textarea', true, false, true, false, true, '{"max":500}'::jsonb, null::jsonb, 'Ringkasan kegiatan dan tujuannya.', 2),
  ('ekstrakurikuler', 'foto', 'Foto kegiatan', 'media', false, false, false, false, false, '{}'::jsonb, null::jsonb, 'Foto utama kegiatan.', 3),
  ('ekstrakurikuler', 'pembina', 'Pembina', 'text', false, false, false, false, true, '{"max":120}'::jsonb, null::jsonb, 'Nama pembina atau pelatih.', 4),
  ('ekstrakurikuler', 'jadwal', 'Jadwal', 'text', false, false, false, false, true, '{"max":120}'::jsonb, null::jsonb, 'Contoh: Setiap Jumat, 15.00-17.00.', 5),

  ('fasilitas', 'nama', 'Nama fasilitas', 'text', true, false, true, false, true, '{"max":120}'::jsonb, null::jsonb, 'Nama sarana atau prasarana.', 1),
  ('fasilitas', 'deskripsi', 'Deskripsi', 'textarea', true, false, true, false, true, '{"max":500}'::jsonb, null::jsonb, 'Penjelasan singkat fasilitas.', 2),
  ('fasilitas', 'foto', 'Foto fasilitas', 'media', false, false, false, false, false, '{}'::jsonb, null::jsonb, 'Foto utama fasilitas.', 3),
  ('fasilitas', 'lokasi', 'Lokasi', 'text', false, false, false, false, true, '{"max":120}'::jsonb, null::jsonb, 'Lokasi fasilitas di lingkungan lembaga.', 4),
  ('fasilitas', 'kapasitas', 'Kapasitas', 'text', false, false, false, false, true, '{"max":80}'::jsonb, null::jsonb, 'Contoh: 30 siswa atau 200 orang.', 5),

  ('prestasi', 'judul', 'Judul prestasi', 'text', true, false, true, false, true, '{"max":120}'::jsonb, null::jsonb, 'Nama lomba, ajang, atau capaian.', 1),
  ('prestasi', 'ringkasan', 'Ringkasan', 'textarea', true, false, true, false, true, '{"max":300}'::jsonb, null::jsonb, 'Ringkasan capaian untuk daftar prestasi.', 2),
  ('prestasi', 'isi', 'Deskripsi prestasi', 'richtext', false, false, false, false, false, '{}'::jsonb, null::jsonb, 'Penjelasan lengkap capaian.', 3),
  ('prestasi', 'foto', 'Foto prestasi', 'media', false, false, false, false, false, '{}'::jsonb, null::jsonb, 'Foto utama prestasi.', 4),
  ('prestasi', 'tanggal', 'Tanggal prestasi', 'date', true, false, false, true, true, '{}'::jsonb, null::jsonb, 'Tanggal capaian diperoleh.', 5),
  ('prestasi', 'tingkat', 'Tingkat', 'select', false, false, false, true, true, '{}'::jsonb, '["Sekolah","Kecamatan","Kabupaten/Kota","Provinsi","Nasional","Internasional"]'::jsonb, 'Tingkat penyelenggaraan prestasi.', 6),
  ('prestasi', 'peraih', 'Peraih', 'text', false, false, false, false, true, '{"max":160}'::jsonb, null::jsonb, 'Nama siswa, tim, atau guru yang meraih prestasi.', 7)
) AS f(collection_slug, key, label, field_type, is_required, is_unique, is_searchable, is_filterable, is_listed, validation, options, help_text, sort_order)
  ON c.slug = f.collection_slug
ON CONFLICT (collection_id, key) DO UPDATE SET
  label = EXCLUDED.label,
  field_type = EXCLUDED.field_type,
  is_required = EXCLUDED.is_required,
  is_unique = EXCLUDED.is_unique,
  is_searchable = EXCLUDED.is_searchable,
  is_filterable = EXCLUDED.is_filterable,
  is_listed = EXCLUDED.is_listed,
  validation = EXCLUDED.validation,
  options = EXCLUDED.options,
  help_text = EXCLUDED.help_text,
  sort_order = EXCLUDED.sort_order;

INSERT INTO menu_items (menu_id, label, link_type, collection_id, sort_order)
SELECT m.id, v.label, 'collection', c.id, v.sort_order
FROM menus m
JOIN (VALUES
  ('staff', 'Staf', 2),
  ('program', 'Program', 3),
  ('ekstrakurikuler', 'Ekstrakurikuler', 4),
  ('fasilitas', 'Fasilitas', 5),
  ('prestasi', 'Prestasi', 6)
) AS v(collection_slug, label, sort_order) ON true
JOIN collections c ON c.slug = v.collection_slug
WHERE m.key = 'main'
  AND NOT EXISTS (
    SELECT 1 FROM menu_items existing
    WHERE existing.menu_id = m.id AND existing.collection_id = c.id
  );
