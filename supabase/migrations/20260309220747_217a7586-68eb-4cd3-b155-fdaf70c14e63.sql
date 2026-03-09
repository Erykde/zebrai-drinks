
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS banner_url text;

INSERT INTO public.site_settings (site_name, site_subtitle, primary_color, banner_height)
SELECT 'ZEBRAI DRINKS', 'Delivery rápido na sua porta. Kit Copão, energéticos, refrigerantes e batidinhas!', '#c9941a', '224'
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings LIMIT 1);

INSERT INTO storage.buckets (id, name, public)
VALUES ('banner-images', 'banner-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read banner images" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'banner-images');
CREATE POLICY "Auth upload banner images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'banner-images');
CREATE POLICY "Auth delete banner images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'banner-images');
