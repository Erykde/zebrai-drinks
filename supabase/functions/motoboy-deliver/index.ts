import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { token } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Token obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find order by delivery token
    const { data: order, error: findError } = await supabase
      .from("customer_orders")
      .select("id, status, customer_name, total, delivery_fee, motoboy_id")
      .eq("delivery_token", token)
      .single();

    if (findError || !order) {
      return new Response(
        JSON.stringify({ error: "Pedido não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (req.method === "GET" || (await req.clone().text()).includes('"action":"get"')) {
      // Return order info without marking as delivered
      return new Response(
        JSON.stringify({ order }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (order.status === "delivered") {
      return new Response(
        JSON.stringify({ error: "Pedido já foi entregue" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (order.status === "cancelled") {
      return new Response(
        JSON.stringify({ error: "Pedido foi cancelado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark as delivered
    const { error: updateError } = await supabase
      .from("customer_orders")
      .update({ status: "delivered" })
      .eq("id", order.id);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: "Erro ao atualizar pedido" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Pedido marcado como entregue!" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Motoboy deliver error:", e);
    return new Response(
      JSON.stringify({ error: "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
