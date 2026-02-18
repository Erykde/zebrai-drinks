
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Helper function to check admin role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Products table
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT '',
  image_emoji text DEFAULT '🍹',
  stock integer DEFAULT 99,
  mixer_options jsonb DEFAULT '[]'::jsonb,
  is_promotion boolean DEFAULT false,
  promotion_price numeric,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Products: public read, admin write
CREATE POLICY "Products are publicly readable"
  ON public.products FOR SELECT USING (true);
CREATE POLICY "Admins can insert products"
  ON public.products FOR INSERT
  TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update products"
  ON public.products FOR UPDATE
  TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete products"
  ON public.products FOR DELETE
  TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Site settings table
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  banner_height text DEFAULT '16rem',
  primary_color text DEFAULT '#D4A520',
  site_name text DEFAULT 'ZEBRAI DRINKS',
  site_subtitle text DEFAULT 'As melhores bebidas e drinks da cidade. Peça agora e receba em casa! 🦓',
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site settings are publicly readable"
  ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins can update site settings"
  ON public.site_settings FOR UPDATE
  TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert site settings"
  ON public.site_settings FOR INSERT
  TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- user_roles RLS
CREATE POLICY "Users can read own roles"
  ON public.user_roles FOR SELECT
  TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Insert default site settings
INSERT INTO public.site_settings (site_name, site_subtitle) VALUES ('ZEBRAI DRINKS', 'As melhores bebidas e drinks da cidade. Peça agora e receba em casa! 🦓');

-- Trigger for updated_at on products
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
