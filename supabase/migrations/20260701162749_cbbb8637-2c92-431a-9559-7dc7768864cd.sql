
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS promo_logo text NOT NULL DEFAULT 'usfinds';

CREATE TABLE IF NOT EXISTS public.link_clicks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NULL REFERENCES public.products(id) ON DELETE SET NULL,
  agent text NOT NULL,
  ip_hash text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS link_clicks_product_id_idx ON public.link_clicks(product_id);
CREATE INDEX IF NOT EXISTS link_clicks_created_at_idx ON public.link_clicks(created_at DESC);
GRANT ALL ON public.link_clicks TO service_role;
ALTER TABLE public.link_clicks ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.page_visits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_hash text NOT NULL,
  path text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS page_visits_ip_hash_idx ON public.page_visits(ip_hash);
CREATE INDEX IF NOT EXISTS page_visits_created_at_idx ON public.page_visits(created_at DESC);
GRANT ALL ON public.page_visits TO service_role;
ALTER TABLE public.page_visits ENABLE ROW LEVEL SECURITY;
