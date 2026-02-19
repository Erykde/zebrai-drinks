
-- STEP 1: Revoke public execution of has_role()
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;

-- Note: We keep authenticated because RLS policies use has_role internally
-- and SECURITY DEFINER ensures it works. But the RPC endpoint should not be callable.
-- Actually, RLS policies execute as the table owner, so they bypass RPC permissions.
-- We can safely revoke from authenticated too since the function is SECURITY DEFINER
-- and RLS evaluates it in the definer's context.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM authenticated;

-- STEP 2: Restrict order reads to admins only (remove public SELECT)
DROP POLICY IF EXISTS "Orders are publicly readable" ON customer_orders;
DROP POLICY IF EXISTS "Order items are publicly readable" ON customer_order_items;

-- Admin-only read policies
CREATE POLICY "Admins can read orders" ON customer_orders
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can read order items" ON customer_order_items
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
