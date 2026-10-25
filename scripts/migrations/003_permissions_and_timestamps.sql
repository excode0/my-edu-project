INSERT INTO role_permissions (role_id, permission_key)
SELECT id, 'pages.manage' FROM roles WHERE slug IN ('superadmin', 'admin')
ON CONFLICT (role_id, permission_key) DO NOTHING;

CREATE FUNCTION set_updated_at_timestamp() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'roles', 'users', 'media_folders', 'media', 'site_identities', 'templates',
    'collections', 'collection_fields', 'template_configs', 'collection_items',
    'pages', 'menus', 'menu_items', 'form_submissions'
  ]
  LOOP
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp()',
      table_name || '_updated_at_trigger',
      table_name
    );
  END LOOP;
END;
$$;
