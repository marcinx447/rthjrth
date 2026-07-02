
-- 1. Agent links + new batch values on products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS agent_links jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 2. Admins (Discord ID + password, role)
CREATE TABLE IF NOT EXISTS public.admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_id text NOT NULL UNIQUE,
  username text NOT NULL,
  password text NOT NULL,
  role text NOT NULL DEFAULT 'editor', -- 'super' or 'editor'
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.admins TO service_role;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
-- No public policies: only service_role (server) reads it.

INSERT INTO public.admins (discord_id, username, password, role) VALUES
  ('1508998046414016603', 'francuz', 'francuz', 'super'),
  ('1088801946334417016', 'GrzybNaStopie1._', 'GrzybNaStopie1._', 'editor')
ON CONFLICT (discord_id) DO NOTHING;

-- 3. Site settings (singleton): maintenance + announcement
CREATE TABLE IF NOT EXISTS public.site_settings (
  id int PRIMARY KEY DEFAULT 1,
  maintenance_mode boolean NOT NULL DEFAULT false,
  maintenance_message text NOT NULL DEFAULT 'Przerwa techniczna — wracamy wkrótce.',
  announcement text,
  announcement_active boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT site_settings_singleton CHECK (id = 1)
);
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read site settings" ON public.site_settings FOR SELECT USING (true);
INSERT INTO public.site_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- 4. Product backups (append-only, no delete)
CREATE TABLE IF NOT EXISTS public.product_backups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid,
  snapshot jsonb NOT NULL,
  reason text NOT NULL DEFAULT 'auto', -- 'auto' on add, 'manual', 'import'
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.product_backups TO service_role;
-- explicitly no DELETE/UPDATE grants
ALTER TABLE public.product_backups ENABLE ROW LEVEL SECURITY;
-- No policies = locked from anon/authenticated. Service role bypasses RLS for inserts/reads.

-- Block deletes/updates at the DB level via revoke (defensive)
REVOKE DELETE, UPDATE ON public.product_backups FROM PUBLIC, anon, authenticated, service_role;

-- Trigger: auto-backup on product insert
CREATE OR REPLACE FUNCTION public.snapshot_product_on_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.product_backups (product_id, snapshot, reason)
  VALUES (NEW.id, to_jsonb(NEW), 'auto');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_snapshot_product_on_insert ON public.products;
CREATE TRIGGER trg_snapshot_product_on_insert
AFTER INSERT ON public.products
FOR EACH ROW EXECUTE FUNCTION public.snapshot_product_on_insert();
