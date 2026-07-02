
CREATE TABLE public.outfits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author text NOT NULL DEFAULT 'anon',
  title text NOT NULL,
  description text,
  image_url text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  views integer NOT NULL DEFAULT 0,
  likes integer NOT NULL DEFAULT 0,
  is_hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.outfits TO anon, authenticated;
GRANT ALL ON public.outfits TO service_role;
ALTER TABLE public.outfits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read outfits" ON public.outfits FOR SELECT USING (is_hidden = false);
CREATE POLICY "Public insert outfits" ON public.outfits FOR INSERT WITH CHECK (true);
CREATE POLICY "Public increment views/likes" ON public.outfits FOR UPDATE USING (true) WITH CHECK (true);
CREATE TRIGGER outfits_updated_at BEFORE UPDATE ON public.outfits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.outfit_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  outfit_id uuid NOT NULL REFERENCES public.outfits(id) ON DELETE CASCADE,
  ip_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (outfit_id, ip_hash)
);
GRANT SELECT, INSERT ON public.outfit_likes TO anon, authenticated;
GRANT ALL ON public.outfit_likes TO service_role;
ALTER TABLE public.outfit_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read likes" ON public.outfit_likes FOR SELECT USING (true);
CREATE POLICY "Public insert likes" ON public.outfit_likes FOR INSERT WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.recalc_outfit_likes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.outfits
    SET likes = (SELECT count(*) FROM public.outfit_likes WHERE outfit_id = COALESCE(NEW.outfit_id, OLD.outfit_id))
    WHERE id = COALESCE(NEW.outfit_id, OLD.outfit_id);
  RETURN NULL;
END; $$;
CREATE TRIGGER outfit_likes_recalc AFTER INSERT OR DELETE ON public.outfit_likes
FOR EACH ROW EXECUTE FUNCTION public.recalc_outfit_likes();
