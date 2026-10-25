CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE institution_level AS ENUM ('tk', 'sd', 'smp', 'sma', 'smk', 'mi', 'mts', 'ma', 'pt', 'kursus', 'lainnya');
CREATE TYPE institution_status AS ENUM ('negeri', 'swasta');
CREATE TYPE media_kind AS ENUM ('image', 'video', 'document', 'audio', 'other');
CREATE TYPE storage_provider AS ENUM ('local', 's3', 'cloudinary');
CREATE TYPE collection_kind AS ENUM ('static', 'dynamic');
CREATE TYPE collection_mode AS ENUM ('content', 'form', 'hybrid');
CREATE TYPE field_type AS ENUM ('text', 'textarea', 'richtext', 'number', 'boolean', 'date', 'datetime', 'select', 'multiselect', 'url', 'email', 'phone', 'media', 'media_multiple', 'relation', 'json');
CREATE TYPE item_status AS ENUM ('draft', 'scheduled', 'published', 'archived');
CREATE TYPE template_category AS ENUM ('page', 'section', 'list', 'detail', 'widget', 'layout');
CREATE TYPE template_scope AS ENUM ('global', 'page', 'collection_list', 'collection_detail');
CREATE TYPE binding_status AS ENUM ('ok', 'missing_field', 'type_mismatch', 'required_empty');
CREATE TYPE page_type AS ENUM ('static', 'collection_list', 'collection_detail', 'landing', 'system');
CREATE TYPE page_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE menu_location AS ENUM ('header', 'footer', 'sidebar_public', 'mobile');
CREATE TYPE menu_link_type AS ENUM ('page', 'collection', 'external', 'anchor', 'none');
CREATE TYPE submission_status AS ENUM ('new', 'reviewing', 'accepted', 'rejected', 'waiting_list', 'archived');

CREATE TABLE roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug varchar(80) NOT NULL UNIQUE,
  name varchar(120) NOT NULL,
  description text,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_key varchar(120) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (role_id, permission_key)
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(120) NOT NULL,
  email varchar(180) NOT NULL,
  password_hash text,
  role_id uuid NOT NULL REFERENCES roles(id),
  avatar_media_id uuid,
  is_active boolean NOT NULL DEFAULT true,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE UNIQUE INDEX users_email_unique_active ON users (lower(email)) WHERE deleted_at IS NULL;
CREATE INDEX users_role_id_idx ON users(role_id);

CREATE TABLE media_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES media_folders(id) ON DELETE RESTRICT,
  name varchar(120) NOT NULL,
  slug varchar(140) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE NULLS NOT DISTINCT (parent_id, slug)
);

CREATE TABLE media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id uuid REFERENCES media_folders(id) ON DELETE SET NULL,
  kind media_kind NOT NULL,
  storage_provider storage_provider NOT NULL DEFAULT 'local',
  storage_key text NOT NULL UNIQUE,
  public_url text NOT NULL,
  original_name varchar(255) NOT NULL,
  mime_type varchar(120) NOT NULL,
  extension varchar(20) NOT NULL,
  size_bytes bigint NOT NULL CHECK (size_bytes >= 0),
  checksum_sha256 char(64),
  width integer CHECK (width IS NULL OR width >= 0),
  height integer CHECK (height IS NULL OR height >= 0),
  duration_seconds integer CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
  title varchar(200),
  alt_text varchar(255),
  caption text,
  variants jsonb NOT NULL DEFAULT '{}'::jsonb,
  uploaded_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX media_checksum_idx ON media(checksum_sha256);
CREATE INDEX media_folder_id_idx ON media(folder_id);
CREATE INDEX media_kind_idx ON media(kind);
ALTER TABLE users ADD CONSTRAINT users_avatar_media_fk FOREIGN KEY (avatar_media_id) REFERENCES media(id) ON DELETE SET NULL;

CREATE TABLE site_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton_key varchar(10) NOT NULL UNIQUE CHECK (singleton_key = 'main'),
  nama_lembaga varchar(200) NOT NULL,
  nama_singkat varchar(60),
  jenjang institution_level,
  status_lembaga institution_status,
  npsn varchar(20),
  nss varchar(20),
  akreditasi varchar(10),
  tahun_berdiri smallint CHECK (tahun_berdiri IS NULL OR tahun_berdiri BETWEEN 1800 AND 2200),
  slogan varchar(255),
  visi text,
  misi jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(misi) = 'array'),
  sejarah_singkat text,
  alamat text,
  kelurahan varchar(120),
  kecamatan varchar(120),
  kota varchar(120),
  provinsi varchar(120),
  kode_pos varchar(10),
  latitude numeric(10,7),
  longitude numeric(10,7),
  telepon varchar(30),
  email varchar(180),
  whatsapp varchar(30),
  website varchar(255),
  kepala_lembaga varchar(120),
  sosial_media jsonb NOT NULL DEFAULT '{}'::jsonb,
  jam_operasional jsonb NOT NULL DEFAULT '[]'::jsonb,
  logo_media_id uuid REFERENCES media(id) ON DELETE SET NULL,
  favicon_media_id uuid REFERENCES media(id) ON DELETE SET NULL,
  hero_media_id uuid REFERENCES media(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key varchar(120) NOT NULL UNIQUE,
  nama varchar(120) NOT NULL,
  deskripsi text,
  category template_category NOT NULL,
  component_key varchar(160) NOT NULL,
  schema jsonb NOT NULL DEFAULT '{"slots":[]}'::jsonb,
  available_variants jsonb NOT NULL DEFAULT '["default"]'::jsonb,
  default_config jsonb,
  thumbnail_media_id uuid REFERENCES media(id) ON DELETE SET NULL,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  is_system boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug varchar(80) NOT NULL UNIQUE,
  nama varchar(120) NOT NULL,
  deskripsi text,
  kind collection_kind NOT NULL DEFAULT 'dynamic',
  mode collection_mode NOT NULL DEFAULT 'content',
  has_public_detail boolean NOT NULL DEFAULT false,
  url_prefix varchar(80),
  default_list_template_config_id uuid,
  default_detail_template_config_id uuid,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE collection_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  key varchar(80) NOT NULL CHECK (key ~ '^[a-z][a-z0-9_]*$'),
  label varchar(120) NOT NULL,
  field_type field_type NOT NULL,
  is_required boolean NOT NULL DEFAULT false,
  is_unique boolean NOT NULL DEFAULT false,
  is_searchable boolean NOT NULL DEFAULT false,
  is_filterable boolean NOT NULL DEFAULT false,
  is_listed boolean NOT NULL DEFAULT true,
  default_value jsonb,
  options jsonb,
  validation jsonb NOT NULL DEFAULT '{}'::jsonb,
  help_text text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (collection_id, key)
);

CREATE TABLE template_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES templates(id) ON DELETE RESTRICT,
  name varchar(120) NOT NULL,
  scope template_scope NOT NULL,
  collection_id uuid REFERENCES collections(id) ON DELETE CASCADE,
  variant varchar(80) NOT NULL DEFAULT 'default',
  design jsonb NOT NULL DEFAULT '{}'::jsonb,
  slots jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_default boolean NOT NULL DEFAULT false,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (scope IN ('collection_list', 'collection_detail') AND collection_id IS NOT NULL)
    OR (scope IN ('global', 'page') AND collection_id IS NULL)
  )
);
CREATE UNIQUE INDEX template_configs_default_scope_idx
  ON template_configs (template_id, scope, COALESCE(collection_id, '00000000-0000-0000-0000-000000000000'::uuid))
  WHERE is_default;

ALTER TABLE collections
  ADD CONSTRAINT collections_default_list_config_fk FOREIGN KEY (default_list_template_config_id) REFERENCES template_configs(id) ON DELETE SET NULL,
  ADD CONSTRAINT collections_default_detail_config_fk FOREIGN KEY (default_detail_template_config_id) REFERENCES template_configs(id) ON DELETE SET NULL;

CREATE TABLE collection_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  slug varchar(200) NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(data) = 'object'),
  status item_status NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  scheduled_at timestamptz,
  template_config_id uuid REFERENCES template_configs(id) ON DELETE SET NULL,
  seo_title varchar(70),
  seo_description varchar(180),
  seo_og_media_id uuid REFERENCES media(id) ON DELETE SET NULL,
  sort_order integer,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (collection_id, slug)
);
CREATE INDEX collection_items_public_idx ON collection_items(collection_id, status, published_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX collection_items_data_gin_idx ON collection_items USING gin(data);
CREATE INDEX collection_items_created_idx ON collection_items(collection_id, created_at DESC);

CREATE TABLE collection_item_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES collection_items(id) ON DELETE CASCADE,
  media_id uuid NOT NULL REFERENCES media(id) ON DELETE RESTRICT,
  field_key varchar(80) NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (item_id, field_key, media_id)
);

CREATE TABLE template_bindings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_config_id uuid NOT NULL REFERENCES template_configs(id) ON DELETE CASCADE,
  slot_key varchar(80) NOT NULL,
  collection_field_id uuid REFERENCES collection_fields(id) ON DELETE SET NULL,
  static_value jsonb,
  status binding_status NOT NULL DEFAULT 'ok',
  synced_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (template_config_id, slot_key)
);
CREATE INDEX template_bindings_field_idx ON template_bindings(collection_field_id);

CREATE TABLE pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES pages(id) ON DELETE RESTRICT,
  type page_type NOT NULL DEFAULT 'static',
  title varchar(200) NOT NULL,
  slug varchar(200) NOT NULL,
  full_path varchar(500) NOT NULL UNIQUE,
  template_config_id uuid REFERENCES template_configs(id) ON DELETE SET NULL,
  collection_id uuid REFERENCES collections(id) ON DELETE SET NULL,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  status page_status NOT NULL DEFAULT 'draft',
  seo_title varchar(70),
  seo_description varchar(180),
  seo_og_media_id uuid REFERENCES media(id) ON DELETE SET NULL,
  robots varchar(60) DEFAULT 'index,follow',
  is_protected boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE NULLS NOT DISTINCT (parent_id, slug)
);
CREATE INDEX pages_status_path_idx ON pages(status, full_path) WHERE deleted_at IS NULL;

CREATE TABLE menus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key varchar(80) NOT NULL UNIQUE,
  nama varchar(120) NOT NULL,
  location menu_location NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id uuid NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES menu_items(id) ON DELETE CASCADE,
  label varchar(120) NOT NULL,
  link_type menu_link_type NOT NULL DEFAULT 'none',
  page_id uuid REFERENCES pages(id) ON DELETE SET NULL,
  collection_id uuid REFERENCES collections(id) ON DELETE SET NULL,
  external_url varchar(500),
  icon varchar(80),
  is_visible boolean NOT NULL DEFAULT true,
  open_in_new_tab boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (link_type = 'page' AND page_id IS NOT NULL AND collection_id IS NULL AND external_url IS NULL)
    OR (link_type = 'collection' AND collection_id IS NOT NULL AND page_id IS NULL AND external_url IS NULL)
    OR (link_type IN ('external', 'anchor') AND external_url IS NOT NULL AND page_id IS NULL AND collection_id IS NULL)
    OR (link_type = 'none' AND page_id IS NULL AND collection_id IS NULL AND external_url IS NULL)
  )
);
CREATE INDEX menu_items_order_idx ON menu_items(menu_id, parent_id, sort_order);

CREATE TABLE form_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL REFERENCES collections(id) ON DELETE RESTRICT,
  reference_code varchar(40) NOT NULL UNIQUE,
  data jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(data) = 'object'),
  status submission_status NOT NULL DEFAULT 'new',
  status_note text,
  contact_email varchar(180),
  contact_phone varchar(30),
  ip_hash char(64),
  user_agent varchar(255),
  reviewed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX form_submissions_status_idx ON form_submissions(collection_id, status, submitted_at DESC);

CREATE TABLE settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "group" varchar(60) NOT NULL,
  key varchar(120) NOT NULL,
  value jsonb NOT NULL,
  is_secret boolean NOT NULL DEFAULT false,
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("group", key)
);

CREATE TABLE audit_logs (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action varchar(80) NOT NULL,
  entity_type varchar(80) NOT NULL,
  entity_id uuid,
  "before" jsonb,
  "after" jsonb,
  ip_hash char(64),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_logs_created_idx ON audit_logs(created_at DESC);
CREATE INDEX audit_logs_user_idx ON audit_logs(user_id, created_at DESC);

CREATE TABLE content_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type varchar(80) NOT NULL,
  entity_id uuid NOT NULL,
  data jsonb NOT NULL,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX content_revisions_entity_idx ON content_revisions(entity_type, entity_id, created_at DESC);

CREATE TABLE auth_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash char(64) NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX auth_sessions_user_idx ON auth_sessions(user_id);
CREATE INDEX auth_sessions_expiry_idx ON auth_sessions(expires_at);

CREATE TABLE auth_login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier_hash char(64) NOT NULL,
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  window_started_at timestamptz NOT NULL DEFAULT now(),
  blocked_until timestamptz,
  UNIQUE (identifier_hash)
);
