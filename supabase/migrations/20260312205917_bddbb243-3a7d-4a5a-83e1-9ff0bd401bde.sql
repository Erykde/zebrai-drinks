
-- Create motoboys table
CREATE TABLE public.motoboys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.motoboys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage motoboys" ON public.motoboys
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Motoboys are publicly readable" ON public.motoboys
  FOR SELECT TO public
  USING (is_active = true);

-- Add motoboy_id and delivery_token to customer_orders
ALTER TABLE public.customer_orders
  ADD COLUMN motoboy_id uuid REFERENCES public.motoboys(id) ON DELETE SET NULL,
  ADD COLUMN delivery_token text UNIQUE;
