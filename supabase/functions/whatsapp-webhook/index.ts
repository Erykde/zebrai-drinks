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
    const body = await req.json();
    console.log("Webhook received:", JSON.stringify(body).substring(0, 500));

    // Evolution API sends different event types
    const event = body.event;

    // We only care about incoming messages
    if (event !== "messages.upsert") {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const messageData = body.data;
    if (!messageData || messageData.key?.fromMe) {
      // Ignore our own messages
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const remoteJid = messageData.key?.remoteJid || "";
    const phone = remoteJid.replace("@s.whatsapp.net", "").replace("@g.us", "");
    const incomingText = (
      messageData.message?.conversation ||
      messageData.message?.extendedTextMessage?.text ||
      ""
    ).trim().toLowerCase();

    if (!phone || !incomingText) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Skip group messages
    if (remoteJid.includes("@g.us")) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: config } = await supabase
      .from("whatsapp_config")
      .select("*")
      .limit(1)
      .single();

    if (!config || !config.is_active || !config.api_url || !config.api_key) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const siteUrl = "https://www.zebraidrinks.com.br";
    let reply = "";

    // Menu option detection
    if (incomingText === "1") {
      reply = (config.menu_option_1_reply || "").replace(/{site_url}/g, siteUrl);
    } else if (incomingText === "2") {
      reply = (config.menu_option_2_reply || "").replace(/{site_url}/g, siteUrl);
    } else if (incomingText === "3") {
      reply = (config.menu_option_3_reply || "").replace(/{site_url}/g, siteUrl);
    } else if (incomingText === "4") {
      reply = (config.menu_option_4_reply || "").replace(/{site_url}/g, siteUrl);
    } else {
      // Any other message → send welcome/menu
      reply = (config.menu_message || "").replace(/{site_url}/g, siteUrl);
    }

    if (!reply) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send reply via Evolution API
    const url = `${config.api_url.replace(/\/$/, "")}/message/sendText/${config.instance_name}`;
    const fullPhone = phone.startsWith("55") ? phone : `55${phone}`;

    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: config.api_key,
      },
      body: JSON.stringify({
        number: fullPhone,
        text: reply,
      }),
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
