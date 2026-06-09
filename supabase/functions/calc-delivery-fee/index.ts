import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3.23.8';

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/google_maps';
const ORIGIN = 'Rua Monte Sinai, 38 - Costeira, São José dos Pinhais - PR, Brasil';

const BodySchema = z.object({
  address: z.string().trim().min(5).max(300),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!LOVABLE_API_KEY || !GOOGLE_MAPS_API_KEY) {
      return new Response(JSON.stringify({ error: 'Missing Google Maps credentials' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Endereço inválido' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { address } = parsed.data;

    // Use Routes API computeRouteMatrix
    const res = await fetch(`${GATEWAY_URL}/routes/distanceMatrix/v2:computeRouteMatrix`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': GOOGLE_MAPS_API_KEY,
        'Content-Type': 'application/json',
        'X-Goog-FieldMask': 'originIndex,destinationIndex,distanceMeters,status,condition',
      },
      body: JSON.stringify({
        origins: [{ waypoint: { address: ORIGIN } }],
        destinations: [{ waypoint: { address: `${address}, Brasil` } }],
        travelMode: 'DRIVE',
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error('Routes API error', res.status, txt);
      return new Response(JSON.stringify({ error: 'Falha ao calcular distância' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await res.json();
    const first = Array.isArray(data) ? data[0] : data;
    if (!first || first.condition !== 'ROUTE_EXISTS' || typeof first.distanceMeters !== 'number') {
      return new Response(JSON.stringify({ error: 'Endereço não encontrado' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const km = first.distanceMeters / 1000;
    const fee = Math.max(7, Math.round(km));

    return new Response(JSON.stringify({ km: Math.round(km * 10) / 10, fee }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
