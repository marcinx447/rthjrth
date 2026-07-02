
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false;
ALTER TABLE public.outfits ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS products_verified_idx ON public.products(is_verified);
CREATE INDEX IF NOT EXISTS outfits_verified_idx ON public.outfits(is_verified);
