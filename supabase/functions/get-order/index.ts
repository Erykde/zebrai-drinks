import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const orderId = url.searchParams.get("id");
    const phone = url.searchParams.get("phone");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Search by phone - returns list of orders
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, "");
      if (cleanPhone.length < 10 || cleanPhone.length > 15) {
        return new Response(
          JSON.stringify({ error: "Invalid phone" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: orders } = await supabase
        .from("customer_orders")
        .select("id, customer_name, status, total, delivery_fee, customer_address, created_at, customer_phone")
        .ilike("customer_phone", `%${cleanPhone}%`)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!orders || orders.length === 0) {
        return new Response(
          JSON.stringify([]),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Fetch items for each order
      const orderIds = orders.map(o => o.id);
      const { data: allItems } = await supabase
        .from("customer_order_items")
        .select("order_id, product_name, quantity, unit_price, total")
        .in("order_id", orderIds);

      const result = orders.map(o => ({
        ...o,
        items: (allItems ?? []).filter(i => i.order_id === o.id),
      }));

      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Single order by ID
    if (!orderId) {
      return new Response(
        JSON.stringify({ error: "Missing order id or phone" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(orderId)) {
      return new Response(
        JSON.stringify({ error: "Invalid order id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: order, error: orderError } = await supabase
      .from("customer_orders")
      .select("id, customer_name, status, total, delivery_fee, customer_address, created_at")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: items } = await supabase
      .from("customer_order_items")
      .select("product_name, quantity, unit_price, total")
      .eq("order_id", orderId);

    return new Response(
      JSON.stringify({ ...order, items: items ?? [] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
