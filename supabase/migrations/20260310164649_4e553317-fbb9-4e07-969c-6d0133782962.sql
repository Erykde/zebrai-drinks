ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS cart_title text DEFAULT 'SEU CARRINHO',
  ADD COLUMN IF NOT EXISTS cart_empty_title text DEFAULT 'CARRINHO VAZIO',
  ADD COLUMN IF NOT EXISTS cart_empty_subtitle text DEFAULT 'Adicione bebidas do nosso cardápio!',
  ADD COLUMN IF NOT EXISTS cart_button_text text DEFAULT 'Finalizar Pedido →',
  ADD COLUMN IF NOT EXISTS home_search_placeholder text DEFAULT 'Pesquise um produto';