import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { action, productName, category } = await req.json();

    if (action === "description") {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            {
              role: "system",
              content: "Você é um especialista em marketing de bebidas e drinks. Gere descrições curtas (máximo 120 caracteres), atraentes e criativas para produtos de uma loja de drinks chamada Zebrai Drinks. Use emojis com moderação. Responda APENAS com a descrição, sem aspas ou explicações.",
            },
            {
              role: "user",
              content: `Gere uma descrição atraente para o produto "${productName}" da categoria "${category}".`,
            },
          ],
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns segundos." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "Créditos esgotados." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error(`AI error: ${response.status}`);
      }

      const data = await response.json();
      const description = data.choices?.[0]?.message?.content?.trim() || "";
      return new Response(JSON.stringify({ description }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "image") {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3.1-flash-image-preview",
          messages: [
            {
              role: "user",
              content: `Professional product photo of "${productName}" (${category}). Studio lighting, clean dark background, high quality food/drink photography. The drink/product should be the hero, centered, with dramatic lighting. No text, no labels, no watermarks.`,
            },
          ],
          modalities: ["image", "text"],
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns segundos." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "Créditos esgotados." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error(`AI image error: ${response.status}`);
      }

      const data = await response.json();
      const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url || "";

      if (!imageUrl) {
        return new Response(JSON.stringify({ error: "Não foi possível gerar a imagem." }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Upload to Supabase Storage using service role client
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

      const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      // Convert base64 to binary using chunked approach
      const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, "");
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      const chunkSize = 8192;
      for (let i = 0; i < binaryString.length; i += chunkSize) {
        const end = Math.min(i + chunkSize, binaryString.length);
        for (let j = i; j < end; j++) {
          bytes[j] = binaryString.charCodeAt(j);
        }
      }

      const fileName = `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from("product-images")
        .upload(fileName, bytes, {
          contentType: "image/png",
          cacheControl: "3600",
        });

      if (uploadError) {
        console.error("Upload error:", JSON.stringify(uploadError));
        throw new Error("Failed to upload image");
      }

      const { data: urlData } = supabaseAdmin.storage
        .from("product-images")
        .getPublicUrl(fileName);

      return new Response(JSON.stringify({ imageUrl: urlData.publicUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-product error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
