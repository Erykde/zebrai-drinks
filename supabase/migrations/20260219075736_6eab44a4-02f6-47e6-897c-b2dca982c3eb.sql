
-- Create order status enum
CREATE TYPE public.order_status AS ENUM ('pending', 'preparing', 'out_for_delivery', 'delivered', 'cancelled');

-- Create customer orders table
CREATE TABLE public.customer_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_phone text,
  customer_address text,
  status order_status NOT NULL DEFAULT 'pending',
  notes text,
  delivery_fee numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create customer order items table
CREATE TABLE public.customer_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.customer_orders(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id),
  product_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL,
  cost_price numeric NOT NULL DEFAULT 0,
  mixer text,
  total numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customer_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_order_items ENABLE ROW LEVEL SECURITY;

-- Customer orders policies
CREATE POLICY "Anyone can create orders" ON public.customer_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Orders are publicly readable" ON public.customer_orders FOR SELECT USING (true);
CREATE POLICY "Admins can update orders" ON public.customer_orders FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete orders" ON public.customer_orders FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Customer order items policies
CREATE POLICY "Anyone can create order items" ON public.customer_order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Order items are publicly readable" ON public.customer_order_items FOR SELECT USING (true);
CREATE POLICY "Admins can update order items" ON public.customer_order_items FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete order items" ON public.customer_order_items FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_customer_orders_updated_at
BEFORE UPDATE ON public.customer_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for new orders notification
ALTER PUBLICATION supabase_realtime ADD TABLE public.customer_orders;
