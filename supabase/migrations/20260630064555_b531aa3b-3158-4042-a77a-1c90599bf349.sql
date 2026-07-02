
-- Admin permissions, ban system
ALTER TABLE public.admins
  ADD COLUMN IF NOT EXISTS permissions text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ban_reason text,
  ADD COLUMN IF NOT EXISTS banned_at timestamptz;

-- Super admin password update
UPDATE public.admins SET password = 'francuz12' WHERE discord_id = '1508998046414016603';

-- Editor default permissions if empty
UPDATE public.admins
  SET permissions = ARRAY['products.create','products.edit','products.delete','products.import','products.export']
  WHERE role = 'editor' AND (permissions IS NULL OR cardinality(permissions) = 0);

-- Popup fields on site_settings
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS popup_active boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS popup_title text NOT NULL DEFAULT 'Ważne ogłoszenie',
  ADD COLUMN IF NOT EXISTS popup_message text NOT NULL DEFAULT '';

-- Make sure single row exists
INSERT INTO public.site_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Remove contact_url usage (keep column for backward compat — no schema drop to avoid breaking existing exports)
-- (intentionally not dropping contact_url; UI will hide it)
