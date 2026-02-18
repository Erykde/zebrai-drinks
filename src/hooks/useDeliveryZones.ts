import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DeliveryZone {
  id: string;
  zone_name: string;
  min_km: number;
  max_km: number;
  fee: number;
  sort_order: number;
  is_active: boolean;
}

export function useDeliveryZones() {
  return useQuery({
    queryKey: ['delivery-zones'],
    queryFn: async (): Promise<DeliveryZone[]> => {
      const { data, error } = await supabase
        .from('delivery_zones')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data ?? []) as DeliveryZone[];
    },
  });
}
