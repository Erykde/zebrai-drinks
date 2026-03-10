import { useState, useRef, useEffect } from 'react';
import { useSiteSettings, useUpdateSiteSettings } from '@/hooks/useSiteSettings';
import { supabase } from '@/integrations/supabase/client';
import { Save, Upload, Loader2, Palette, Type, Image } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const SiteSettingsManager = () => {
  const { data: settings, isLoading } = useSiteSettings();
  const updateSettings = useUpdateSiteSettings();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    site_name: '',
    site_subtitle: '',
    primary_color: '#c9941a',
    banner_url: '',
    cart_title: '',
    cart_empty_title: '',
    cart_empty_subtitle: '',
    cart_button_text: '',
    home_search_placeholder: '',
  });

  useEffect(() => {
    if (settings) {
      setForm({
        site_name: settings.site_name || '',
        site_subtitle: settings.site_subtitle || '',
        primary_color: settings.primary_color || '#c9941a',
        banner_url: settings.banner_url || '',
        cart_title: settings.cart_title || '',
        cart_empty_title: settings.cart_empty_title || '',
        cart_empty_subtitle: settings.cart_empty_subtitle || '',
        cart_button_text: settings.cart_button_text || '',
        home_search_placeholder: settings.home_search_placeholder || '',
      });
    }
  }, [settings]);

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Selecione uma imagem!'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Máximo 5MB!'); return; }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `banner-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('banner-images').upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('banner-images').getPublicUrl(fileName);
      setForm(f => ({ ...f, banner_url: data.publicUrl }));
      toast.success('Banner enviado!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    try {
      await updateSettings.mutateAsync({
        id: settings.id,
        site_name: form.site_name || null,
        site_subtitle: form.site_subtitle || null,
        primary_color: form.primary_color || null,
        banner_url: form.banner_url || null,
      });
      toast.success('Configurações salvas!');
    } catch {
      toast.error('Erro ao salvar');
    }
  };

  if (isLoading) return <p className="text-muted-foreground">Carregando...</p>;

  return (
    <div className="space-y-4">
      {/* Banner */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Image className="h-4 w-4 text-primary" /> Banner do Site
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {form.banner_url && (
            <img src={form.banner_url} alt="Banner" className="w-full h-40 object-cover rounded-lg border border-border" />
          )}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
              {uploading ? 'Enviando...' : 'Enviar imagem'}
            </Button>
            {form.banner_url && (
              <Button variant="ghost" size="sm" onClick={() => setForm(f => ({ ...f, banner_url: '' }))}>
                Remover
              </Button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
          <div>
            <label className="text-xs text-muted-foreground">Ou cole a URL da imagem:</label>
            <Input
              value={form.banner_url}
              onChange={e => setForm(f => ({ ...f, banner_url: e.target.value }))}
              placeholder="https://..."
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Textos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Type className="h-4 w-4 text-primary" /> Textos do Site
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Título principal</label>
            <Input
              value={form.site_name}
              onChange={e => setForm(f => ({ ...f, site_name: e.target.value }))}
              placeholder="BEBIDAS GELADAS"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Subtítulo / descrição</label>
            <textarea
              value={form.site_subtitle}
              onChange={e => setForm(f => ({ ...f, site_subtitle: e.target.value }))}
              placeholder="Delivery rápido na sua porta..."
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[60px] resize-y"
            />
          </div>
        </CardContent>
      </Card>

      {/* Cor */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" /> Cor Principal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={form.primary_color}
              onChange={e => setForm(f => ({ ...f, primary_color: e.target.value }))}
              className="w-12 h-10 rounded border border-border cursor-pointer"
            />
            <Input
              value={form.primary_color}
              onChange={e => setForm(f => ({ ...f, primary_color: e.target.value }))}
              placeholder="#c9941a"
              className="w-32"
            />
            <div className="h-8 w-8 rounded-full border border-border" style={{ backgroundColor: form.primary_color }} />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Essa cor será aplicada nos botões, destaques e categorias do site.</p>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="w-full" disabled={updateSettings.isPending}>
        <Save className="h-4 w-4 mr-2" />
        {updateSettings.isPending ? 'Salvando...' : 'Salvar Configurações'}
      </Button>
    </div>
  );
};

export default SiteSettingsManager;
