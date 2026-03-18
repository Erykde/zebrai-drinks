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
        const errText = await response.text();
        console.error("AI API error:", response.status, errText);
        throw new Error(`AI image error: ${response.status}`);
      }

      const data = await response.json();
      console.log("AI response keys:", JSON.stringify(Object.keys(data)));
      
      // Try multiple possible response formats
      let imageBase64 = "";
      const choice = data.choices?.[0]?.message;
      
      if (choice?.images?.[0]?.image_url?.url) {
        imageBase64 = choice.images[0].image_url.url;
      } else if (choice?.content) {
        // Check if content contains inline image data
        const parts = Array.isArray(choice.content) ? choice.content : [];
        for (const part of parts) {
          if (part?.type === "image_url" && part?.image_url?.url) {
            imageBase64 = part.image_url.url;
            break;
          }
          if (part?.inline_data?.data) {
            imageBase64 = `data:${part.inline_data.mime_type || "image/png"};base64,${part.inline_data.data}`;
            break;
          }
        }
        // If content is a string with base64
        if (!imageBase64 && typeof choice.content === "string" && choice.content.startsWith("data:image")) {
          imageBase64 = choice.content;
        }
      }

      if (!imageBase64) {
        console.error("No image found in response. Full response:", JSON.stringify(data).substring(0, 2000));
        return new Response(JSON.stringify({ error: "Não foi possível gerar a imagem." }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Upload to Supabase Storage
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

      // Clean base64 data
      let cleanBase64 = imageBase64;
      if (cleanBase64.includes(",")) {
        cleanBase64 = cleanBase64.split(",")[1];
      }
      cleanBase64 = cleanBase64.replace(/\s/g, "");

      // Convert to binary
      const binaryString = atob(cleanBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const fileName = `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;

      // Use raw fetch with both apikey and Authorization headers
      const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/product-images/${fileName}`, {
        method: "POST",
        headers: {
          "apikey": SUPABASE_SERVICE_ROLE_KEY,
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "image/png",
          "x-upsert": "true",
        },
        body: bytes,
      });

      if (!uploadRes.ok) {
        const errText = await uploadRes.text();
        console.error("Upload error:", uploadRes.status, errText);
        
        // Fallback: try with Supabase client
        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        
        const { error: uploadError } = await supabaseAdmin.storage
          .from("product-images")
          .upload(fileName, bytes, { contentType: "image/png", cacheControl: "3600" });

        if (uploadError) {
          console.error("Fallback upload error:", JSON.stringify(uploadError));
          throw new Error("Failed to upload image");
        }
      } else {
        await uploadRes.text(); // consume body
      }

      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/product-images/${fileName}`;
      return new Response(JSON.stringify({ imageUrl: publicUrl }), {
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
