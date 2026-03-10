import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SiteSettings {
  id: string;
  site_name: string | null;
  site_subtitle: string | null;
  primary_color: string | null;
  banner_height: string | null;
  banner_url: string | null;
  cart_title: string | null;
  cart_empty_title: string | null;
  cart_empty_subtitle: string | null;
  cart_button_text: string | null;
  home_search_placeholder: string | null;
  updated_at: string | null;
}

export const useSiteSettings = () => {
  return useQuery({
    queryKey: ['site-settings'],
    queryFn: async (): Promise<SiteSettings | null> => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as SiteSettings | null;
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useUpdateSiteSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<SiteSettings> & { id: string }) => {
      const { id, ...rest } = updates;
      const { error } = await supabase
        .from('site_settings')
        .update({ ...rest, updated_at: new Date().toISOString() } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
    },
  });
};
