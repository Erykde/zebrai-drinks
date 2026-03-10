ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS nav_home_label text DEFAULT 'Início',
  ADD COLUMN IF NOT EXISTS nav_cart_label text DEFAULT 'Carrinho';