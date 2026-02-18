
-- Delivery fee zones based on distance from store (Rua Monte Sinai 38, Costeira, SJP)
CREATE TABLE public.delivery_zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_name TEXT NOT NULL,
  min_km NUMERIC NOT NULL DEFAULT 0,
  max_km NUMERIC NOT NULL,
  fee NUMERIC NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Delivery zones are publicly readable"
  ON public.delivery_zones FOR SELECT USING (true);

CREATE POLICY "Admins can manage delivery zones"
  ON public.delivery_zones FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default zones
INSERT INTO public.delivery_zones (zone_name, min_km, max_km, fee, sort_order) VALUES
  ('Costeira / Centro (até 3km)', 0, 3, 5.00, 1),
  ('Afonso Pena / Guatupê (3-5km)', 3, 5, 8.00, 2),
  ('Cidade Jardim / Del Rey (5-8km)', 5, 8, 12.00, 3),
  ('Borda do Campo / São Marcos (8-12km)', 8, 12, 16.00, 4),
  ('Curitiba - Boqueirão / Sítio Cercado (12-18km)', 12, 18, 22.00, 5);
