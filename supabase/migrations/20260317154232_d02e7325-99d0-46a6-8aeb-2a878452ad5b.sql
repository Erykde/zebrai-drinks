
-- Add store configuration columns to site_settings
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS store_open boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS min_order_value numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS pickup_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS payment_methods jsonb DEFAULT '["PIX","Dinheiro","Cartão de Crédito","Cartão de Débito"]'::jsonb,
  ADD COLUMN IF NOT EXISTS opening_hours jsonb DEFAULT '{"weekdays":"18:00 às 23:00","weekend":"18:00 às 22:00"}'::jsonb,
  ADD COLUMN IF NOT EXISTS prep_time text DEFAULT '10 a 20 minutos',
  ADD COLUMN IF NOT EXISTS store_address text DEFAULT 'Rua Monte Sinai, 38 - Costeira, São José dos Pinhais - PR',
  ADD COLUMN IF NOT EXISTS store_phone text DEFAULT '5541984296633';

-- Create customer_addresses table for saved delivery addresses
CREATE TABLE public.customer_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT 'Casa',
  address text NOT NULL,
  complement text,
  is_default boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own addresses" ON public.customer_addresses
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own addresses" ON public.customer_addresses
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addresses" ON public.customer_addresses
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own addresses" ON public.customer_addresses
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create customer_coupons table to track redeemed coupons per user
CREATE TABLE public.customer_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coupon_id uuid NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  used_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, coupon_id)
);

ALTER TABLE public.customer_coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own coupons" ON public.customer_coupons
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own coupons" ON public.customer_coupons
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
