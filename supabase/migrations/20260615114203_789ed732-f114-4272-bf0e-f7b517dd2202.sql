
ALTER TABLE public.site_settings 
  ADD COLUMN IF NOT EXISTS free_delivery_km numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS loyalty_divisor numeric NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS loyalty_description text,
  ADD COLUMN IF NOT EXISTS loyalty_tiers jsonb;
