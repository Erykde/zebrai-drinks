import { z } from 'npm:zod@3.23.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/google_maps';
const ORIGIN = 'Rua Monte Sinai, 38 - Costeira, São José dos Pinhais - PR, Brasil';

const BodySchema = z.object({
  address: z.string().trim().min(5).max(300),
});

// Maximum delivery radius (km). Beyond this, the order is refused.
const MAX_DELIVERY_KM = 25;
const DEFAULT_FEE = 7;

const normalizeAddress = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

const nearbyEstimateKm = (address: string) => {
  const normalized = normalizeAddress(address);
  if (normalized.includes('monte sinai')) return 0.2;
  if (normalized.includes('costeira')) return 2.5;
  return null;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Endereço inválido' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { address } = parsed.data;

    const localEstimate = nearbyEstimateKm(address);
    if (localEstimate !== null) {
      return new Response(JSON.stringify({ km: localEstimate, fee: DEFAULT_FEE, estimated: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!LOVABLE_API_KEY || !GOOGLE_MAPS_API_KEY) {
      return new Response(JSON.stringify({ error: 'Frete padrão aplicado; a loja confirma se precisar ajustar.', fee: DEFAULT_FEE }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
        destinations: [{ waypoint: { address: `${address}, São José dos Pinhais, PR, Brasil` } }],
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

    if (km > MAX_DELIVERY_KM) {
      return new Response(JSON.stringify({
        error: `Fora da área de entrega (${Math.round(km)} km). Máximo: ${MAX_DELIVERY_KM} km. Confira o endereço (rua, número, bairro e cidade).`,
        outOfRange: true,
        km: Math.round(km * 10) / 10,
      }), {
        status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
