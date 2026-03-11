import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WhatsAppConfig {
  api_url: string;
  api_key: string;
  instance_name: string;
  is_active: boolean;
}

async function getConfig(supabase: any): Promise<WhatsAppConfig | null> {
  const { data } = await supabase
    .from("whatsapp_config")
    .select("api_url, api_key, instance_name, is_active")
    .limit(1)
    .single();
  return data;
}

async function sendWhatsApp(
  config: WhatsAppConfig,
  phone: string,
  message: string
): Promise<{ ok: boolean; error?: string }> {
  const cleanPhone = phone.replace(/\D/g, "");
  const fullPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;

  const url = `${config.api_url.replace(/\/$/, "")}/message/sendText/${config.instance_name}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: config.api_key,
      },
      body: JSON.stringify({
        number: fullPhone,
        text: message,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("Evolution API error:", res.status, body);
      return { ok: false, error: `Status ${res.status}: ${body}` };
    }

    return { ok: true };
  } catch (e) {
    console.error("Fetch error:", e);
    return { ok: false, error: String(e) };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { phone, message, template, template_data } = await req.json();

    if (!phone) {
      return new Response(
        JSON.stringify({ error: "Telefone é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const config = await getConfig(supabase);
    if (!config || !config.is_active || !config.api_url || !config.api_key) {
      return new Response(
        JSON.stringify({ error: "WhatsApp não configurado ou desativado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If a template name is provided, fetch the template from config
    let finalMessage = message;
    if (template && !message) {
      const { data: fullConfig } = await supabase
        .from("whatsapp_config")
        .select("*")
        .limit(1)
        .single();

      const templateMap: Record<string, string> = {
        welcome: fullConfig?.welcome_message || "",
        order_confirmed: fullConfig?.order_confirmed_message || "",
        order_delivering: fullConfig?.order_delivering_message || "",
        order_delivered: fullConfig?.order_delivered_message || "",
        menu: fullConfig?.menu_message || "",
      };

      finalMessage = templateMap[template] || "";

      // Replace placeholders
      if (template_data && finalMessage) {
        const siteUrl = "https://www.zebraidrinks.com.br";
        finalMessage = finalMessage.replace(/{site_url}/g, siteUrl);
        for (const [key, value] of Object.entries(template_data)) {
          finalMessage = finalMessage.replace(new RegExp(`{${key}}`, "g"), String(value));
        }
      }
    }

    if (!finalMessage) {
      return new Response(
        JSON.stringify({ error: "Mensagem vazia" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await sendWhatsApp(config, phone, finalMessage);

    if (!result.ok) {
      return new Response(
        JSON.stringify({ error: result.error }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("WhatsApp send error:", e);
    return new Response(
      JSON.stringify({ error: "Erro ao enviar mensagem" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
