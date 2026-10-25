INSERT INTO roles (slug, name, description, is_system) VALUES
  ('superadmin', 'Superadmin', 'Akses penuh termasuk pengelolaan pengguna dan pengaturan sistem.', true),
  ('admin', 'Admin', 'Pengelola konten, identitas, media, halaman, navigasi, dan pendaftar.', true),
  ('editor', 'Editor', 'Mengelola konten terbit dan meninjau pendaftar.', true),
  ('kontributor', 'Kontributor', 'Membuat dan mengunggah konten untuk ditinjau.', true),
  ('viewer', 'Viewer', 'Hanya melihat dashboard dan template.', true)
ON CONFLICT (slug) DO NOTHING;

WITH permissions(permission_key) AS (
  VALUES
    ('dashboard.view'), ('identitas.update'), ('media.upload'), ('collection.items.create'),
    ('collection.items.publish'), ('collection.fields.manage'), ('template.config.manage'),
    ('template.view'), ('menu.manage'), ('submission.view'), ('submission.update'),
    ('user.manage'), ('audit.view'), ('settings.manage')
), grants(role_slug, permission_key) AS (
  SELECT 'superadmin', permission_key FROM permissions
  UNION ALL SELECT 'admin', permission_key FROM permissions WHERE permission_key <> 'user.manage' AND permission_key <> 'settings.manage'
  UNION ALL SELECT 'editor', permission_key FROM permissions WHERE permission_key IN ('dashboard.view', 'media.upload', 'collection.items.create', 'collection.items.publish', 'template.view', 'submission.view', 'submission.update')
  UNION ALL SELECT 'kontributor', permission_key FROM permissions WHERE permission_key IN ('dashboard.view', 'media.upload', 'collection.items.create', 'template.view')
  UNION ALL SELECT 'viewer', permission_key FROM permissions WHERE permission_key IN ('dashboard.view', 'template.view')
)
INSERT INTO role_permissions(role_id, permission_key)
SELECT roles.id, grants.permission_key FROM grants JOIN roles ON roles.slug = grants.role_slug
ON CONFLICT (role_id, permission_key) DO NOTHING;

INSERT INTO site_identities (
  singleton_key, nama_lembaga, nama_singkat, jenjang, status_lembaga,
  akreditasi, visi, alamat, kota, provinsi, telepon, email
) VALUES (
  'main', 'SMA Cendekia Nusantara', 'SMA Cendekia', 'sma', 'swasta',
  'A', 'Menjadi komunitas belajar yang unggul, berkarakter, dan siap menghadapi masa depan.',
  'Jl. Pendidikan No. 25, Bandung, Jawa Barat', 'Bandung', 'Jawa Barat',
  '(022) 7000 1234', 'info@cendekia.sch.id'
) ON CONFLICT (singleton_key) DO NOTHING;

INSERT INTO collections (slug, nama, deskripsi, kind, mode, has_public_detail, url_prefix, sort_order) VALUES
  ('berita', 'Berita & kegiatan', 'Artikel, kabar sekolah, dan kegiatan siswa.', 'dynamic', 'content', true, '/berita', 1),
  ('galeri', 'Galeri', 'Dokumentasi kegiatan sekolah.', 'dynamic', 'content', false, '/galeri', 2),
  ('prestasi', 'Prestasi', 'Pencapaian akademik dan non-akademik.', 'dynamic', 'content', false, '/prestasi', 3),
  ('ppdb', 'Penerimaan siswa baru', 'Formulir pendaftaran peserta didik baru.', 'dynamic', 'form', false, '/pendaftaran', 4)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO collection_fields (collection_id, key, label, field_type, is_required, is_searchable, is_listed, sort_order, validation, options)
SELECT c.id, f.key, f.label, f.field_type::field_type, f.is_required, f.is_searchable, true, f.sort_order, f.validation, f.options
FROM collections c
JOIN (VALUES
  ('berita', 'judul', 'Judul', 'text', true, true, 1, '{"max":120}'::jsonb, null::jsonb),
  ('berita', 'ringkasan', 'Ringkasan', 'textarea', false, true, 2, '{"max":300}'::jsonb, null::jsonb),
  ('berita', 'isi', 'Isi Berita', 'richtext', true, true, 3, '{}'::jsonb, null::jsonb),
  ('berita', 'kategori', 'Kategori', 'select', true, true, 4, '{}'::jsonb, '["Akademik","Kegiatan sekolah","Prestasi","Pengumuman"]'::jsonb),
  ('berita', 'tanggal_terbit', 'Tanggal Terbit', 'date', true, false, 5, '{}'::jsonb, null::jsonb),
  ('berita', 'penulis', 'Penulis', 'text', false, false, 6, '{}'::jsonb, null::jsonb),
  ('ppdb', 'nama_siswa', 'Nama calon siswa', 'text', true, true, 1, '{"max":160}'::jsonb, null::jsonb),
  ('ppdb', 'email', 'Email orang tua/wali', 'email', true, false, 2, '{}'::jsonb, null::jsonb),
  ('ppdb', 'telepon', 'Nomor telepon', 'phone', true, false, 3, '{}'::jsonb, null::jsonb),
  ('ppdb', 'asal_sekolah', 'Asal sekolah', 'text', true, true, 4, '{"max":200}'::jsonb, null::jsonb)
) AS f(collection_slug, key, label, field_type, is_required, is_searchable, sort_order, validation, options) ON c.slug = f.collection_slug
ON CONFLICT (collection_id, key) DO NOTHING;

INSERT INTO templates (key, nama, deskripsi, category, component_key, schema, available_variants, default_config)
VALUES
  ('page.home', 'Beranda sekolah', 'Tata letak beranda profil sekolah.', 'page', 'school.home', '{"slots":[{"key":"title","type":"text","required":true},{"key":"intro","type":"textarea","required":false}]}'::jsonb, '["default","modern"]'::jsonb, '{"sections":["hero","about","programs","news","contact"]}'::jsonb),
  ('news.list', 'Daftar berita', 'Daftar konten berita terbit.', 'list', 'collection.list', '{"slots":[{"key":"title","type":"text","required":true}]}'::jsonb, '["default","cards"]'::jsonb, '{"columns":3}'::jsonb),
  ('news.detail', 'Detail berita', 'Tata letak artikel berita.', 'detail', 'collection.detail', '{"slots":[{"key":"title","type":"text","required":true},{"key":"cover","type":"media","required":false},{"key":"body","type":"richtext","required":true}]}'::jsonb, '["default","hero-with-sidebar"]'::jsonb, '{"container":"max-w-5xl"}'::jsonb),
  ('form.admission', 'Formulir pendaftaran', 'Form pendaftaran publik.', 'page', 'forms.admission', '{"slots":[{"key":"title","type":"text","required":true}]}'::jsonb, '["default","single-column"]'::jsonb, '{"columns":1}'::jsonb)
ON CONFLICT (key) DO NOTHING;

INSERT INTO template_configs (template_id, name, scope, collection_id, variant, design, slots, is_default)
SELECT t.id, t.nama || ' default', 'global', NULL, 'default', COALESCE(t.default_config, '{}'::jsonb), '{}'::jsonb, true
FROM templates t WHERE t.key = 'page.home'
ON CONFLICT DO NOTHING;

INSERT INTO template_configs (template_id, name, scope, collection_id, variant, design, slots, is_default)
SELECT t.id, 'Berita list default', 'collection_list', c.id, 'default', COALESCE(t.default_config, '{}'::jsonb), '{"title":{"source":"static","value":"Berita sekolah"}}'::jsonb, true
FROM templates t CROSS JOIN collections c WHERE t.key = 'news.list' AND c.slug = 'berita'
ON CONFLICT DO NOTHING;

INSERT INTO template_configs (template_id, name, scope, collection_id, variant, design, slots, is_default)
SELECT t.id, 'Berita detail default', 'collection_detail', c.id, 'default', COALESCE(t.default_config, '{}'::jsonb),
  '{"title":{"source":"field","key":"judul"},"body":{"source":"field","key":"isi"}}'::jsonb, true
FROM templates t CROSS JOIN collections c WHERE t.key = 'news.detail' AND c.slug = 'berita'
ON CONFLICT DO NOTHING;

UPDATE collections c SET
  default_list_template_config_id = (SELECT id FROM template_configs tc WHERE tc.collection_id = c.id AND tc.scope = 'collection_list' AND tc.is_default LIMIT 1),
  default_detail_template_config_id = (SELECT id FROM template_configs tc WHERE tc.collection_id = c.id AND tc.scope = 'collection_detail' AND tc.is_default LIMIT 1)
WHERE c.slug = 'berita';

INSERT INTO template_bindings (template_config_id, slot_key, collection_field_id, static_value, status)
SELECT tc.id, b.slot_key, cf.id, b.static_value, 'ok'
FROM template_configs tc
JOIN (VALUES
  ('title', 'judul', null::jsonb),
  ('body', 'isi', null::jsonb)
) AS b(slot_key, field_key, static_value) ON true
JOIN collection_fields cf ON cf.collection_id = tc.collection_id AND cf.key = b.field_key
WHERE tc.scope = 'collection_detail' AND tc.is_default
ON CONFLICT (template_config_id, slot_key) DO NOTHING;

INSERT INTO collection_items (collection_id, slug, data, status, published_at, seo_title, seo_description)
SELECT c.id, item.slug, item.data, 'published', item.published_at::timestamptz, item.title, item.excerpt
FROM collections c
CROSS JOIN (VALUES
  ('pekan-kreativitas-siswa', 'Pekan kreativitas siswa kembali hadir', 'Satu pekan untuk berbagi karya, mencoba hal baru, dan berkolaborasi bersama komunitas sekolah.', 'Kegiatan sekolah', '2026-10-12', '3 menit membaca'),
  ('program-pendampingan-belajar', 'Kenali program pendampingan belajar', 'Sesi pendampingan membantu siswa menyusun strategi belajar dan mengembangkan potensi diri.', 'Info akademik', '2026-10-04', '4 menit membaca')
) AS source(slug, title, excerpt, category, published_on, reading_time)
CROSS JOIN LATERAL (
  SELECT source.slug, source.title, source.excerpt,
    jsonb_build_object('judul', source.title, 'ringkasan', source.excerpt, 'isi', source.excerpt,
      'kategori', source.category, 'tanggal_terbit', source.published_on, 'durasi', source.reading_time) AS data,
    source.published_on AS published_at
) AS item
WHERE c.slug = 'berita'
ON CONFLICT (collection_id, slug) DO NOTHING;

INSERT INTO pages (type, title, slug, full_path, content, status, is_protected, published_at)
VALUES
  ('system', 'Beranda', 'beranda', '/', '{"sections":["hero","about","programs","news","contact"]}'::jsonb, 'published', true, now()),
  ('static', 'Profil sekolah', 'profil', '/profil', '{"blocks":[{"type":"richtext","content":"Kenali profil dan perjalanan sekolah kami."}]}'::jsonb, 'published', false, now()),
  ('collection_list', 'Berita', 'berita', '/berita', '{"collection":"berita"}'::jsonb, 'published', false, now()),
  ('landing', 'Pendaftaran siswa baru', 'pendaftaran', '/pendaftaran', '{"collection":"ppdb"}'::jsonb, 'published', false, now())
ON CONFLICT (full_path) DO NOTHING;

INSERT INTO menus (key, nama, location) VALUES
  ('main', 'Menu utama', 'header'),
  ('footer', 'Menu footer', 'footer')
ON CONFLICT (key) DO NOTHING;

INSERT INTO menu_items (menu_id, label, link_type, external_url, sort_order)
SELECT m.id, item.label, 'anchor', item.href, item.sort_order
FROM menus m
CROSS JOIN (VALUES
  ('Tentang', '#tentang', 1),
  ('Pendidikan', '#program', 2),
  ('Prestasi', '#prestasi', 3),
  ('Berita', '#berita', 4),
  ('Kontak', '#kontak', 5)
) AS item(label, href, sort_order)
WHERE m.key = 'main'
ON CONFLICT DO NOTHING;

INSERT INTO settings ("group", key, value, is_secret) VALUES
  ('general', 'site_title', '"SMA Cendekia Nusantara"'::jsonb, false),
  ('general', 'site_description', '"Profil resmi SMA Cendekia Nusantara."'::jsonb, false),
  ('admissions', 'status', '"Membuka pendaftaran tahun ajaran 2026/2027"'::jsonb, false),
  ('admissions', 'enabled', 'true'::jsonb, false)
ON CONFLICT ("group", key) DO NOTHING;
