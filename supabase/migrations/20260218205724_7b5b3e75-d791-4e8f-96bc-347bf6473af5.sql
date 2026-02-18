
-- Add cost_price to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cost_price numeric NOT NULL DEFAULT 0;

-- Create orders table for tracking sales
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL,
  cost_price numeric NOT NULL DEFAULT 0,
  mixer text,
  total numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage orders" ON public.orders
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Orders are insertable by anyone" ON public.orders
  FOR INSERT WITH CHECK (true);

CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX idx_orders_product_id ON public.orders(product_id);
