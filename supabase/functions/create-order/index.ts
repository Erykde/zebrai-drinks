import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory rate limiting (per IP, resets on cold start)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5; // max orders per window
const RATE_WINDOW_MS = 60_000; // 1 minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const ip = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
  if (isRateLimited(ip)) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please wait a moment." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const { customer_name, customer_phone, customer_address, notes, delivery_fee, total, items } = body;

    // Validate required fields
    if (!customer_name || typeof customer_name !== "string" || customer_name.trim().length < 2 || customer_name.trim().length > 100) {
      return new Response(
        JSON.stringify({ error: "Nome inválido (2-100 caracteres)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (customer_phone && (typeof customer_phone !== "string" || customer_phone.trim().length > 20)) {
      return new Response(
        JSON.stringify({ error: "Telefone inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (customer_address && (typeof customer_address !== "string" || customer_address.trim().length > 200)) {
      return new Response(
        JSON.stringify({ error: "Endereço muito longo" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (typeof total !== "number" || total <= 0 || total > 100000) {
      return new Response(
        JSON.stringify({ error: "Total inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
      return new Response(
        JSON.stringify({ error: "Itens inválidos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate each item
    for (const item of items) {
      if (!item.product_name || typeof item.product_name !== "string") {
        return new Response(
          JSON.stringify({ error: "Item sem nome de produto" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (typeof item.quantity !== "number" || item.quantity < 1 || item.quantity > 100) {
        return new Response(
          JSON.stringify({ error: "Quantidade inválida" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (typeof item.unit_price !== "number" || item.unit_price < 0) {
        return new Response(
          JSON.stringify({ error: "Preço inválido" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Look up actual prices from DB to prevent price manipulation
    const productNames = items.map((i: any) => i.product_name);
    const { data: products } = await supabase
      .from("products")
      .select("name, price, cost_price, is_promotion, promotion_price");

    // Insert order
    const { data: orderData, error: orderError } = await supabase
      .from("customer_orders")
      .insert({
        customer_name: customer_name.trim(),
        customer_phone: customer_phone?.trim() || null,
        customer_address: customer_address?.trim() || null,
        notes: notes?.trim()?.substring(0, 500) || null,
        delivery_fee: typeof delivery_fee === "number" ? delivery_fee : 0,
        total,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Insert items (use server-side cost_price from DB)
    const itemsToInsert = items.map((item: any) => {
      const dbProduct = products?.find((p) => item.product_name.includes(p.name));
      const costPrice = dbProduct?.cost_price ?? 0;

      return {
        order_id: orderData.id,
        product_name: item.product_name.substring(0, 200),
        quantity: item.quantity,
        unit_price: item.unit_price,
        cost_price: costPrice,
        mixer: item.mixer?.substring(0, 100) || null,
        total: item.total,
      };
    });

    const { error: itemsError } = await supabase
      .from("customer_order_items")
      .insert(itemsToInsert);

    if (itemsError) throw itemsError;

    // Legacy orders table
    const legacyItems = itemsToInsert.map((item: any) => ({
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      cost_price: item.cost_price,
      mixer: item.mixer,
      total: item.total,
    }));

    await supabase.from("orders").insert(legacyItems);

    return new Response(
      JSON.stringify({ id: orderData.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Create order error:", e);
    return new Response(
      JSON.stringify({ error: "Erro ao criar pedido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
