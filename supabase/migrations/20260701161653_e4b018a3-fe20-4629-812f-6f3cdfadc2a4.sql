
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS promo_active boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS promo_title text NOT NULL DEFAULT 'Claim your -40% code!',
  ADD COLUMN IF NOT EXISTS promo_message text NOT NULL DEFAULT 'We have a special 40% shipping coupon. Limited time offer until the end of the month! Register using our link to get it and use it on your first order.',
  ADD COLUMN IF NOT EXISTS promo_cta_label text NOT NULL DEFAULT 'Register now',
  ADD COLUMN IF NOT EXISTS promo_link text NOT NULL DEFAULT '';
