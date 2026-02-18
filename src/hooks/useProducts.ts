import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DbProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_emoji: string | null;
  image_url: string | null;
  stock: number | null;
  mixer_options: { mixer: string; price: number }[];
  is_promotion: boolean | null;
  promotion_price: number | null;
  sort_order: number | null;
}

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async (): Promise<DbProduct[]> => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data ?? []).map(p => ({
        ...p,
        mixer_options: Array.isArray(p.mixer_options) ? p.mixer_options as any : [],
      }));
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('category');
      if (error) throw error;
      const cats = [...new Set((data ?? []).map(p => p.category))];
      return ['Todos', ...cats];
    },
  });
}
