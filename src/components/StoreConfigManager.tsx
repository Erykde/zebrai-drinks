import { useState, useEffect } from 'react';
import { useSiteSettings, useUpdateSiteSettings } from '@/hooks/useSiteSettings';
import { Save, Plus, X, Store, Clock, CreditCard, MapPin, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

const StoreConfigManager = () => {
  const { data: settings, isLoading } = useSiteSettings();
  const updateSettings = useUpdateSiteSettings();

  const [form, setForm] = useState({
    store_open: true,
    min_order_value: 0,
    delivery_enabled: true,
    pickup_enabled: false,
    payment_methods: ['PIX', 'Dinheiro', 'Cartão de Crédito', 'Cartão de Débito'] as string[],
    opening_hours: { weekdays: '18:00 às 23:00', weekend: '18:00 às 22:00' },
    prep_time: '10 a 20 minutos',
    store_address: '',
    store_phone: '',
  });
  const [newPayment, setNewPayment] = useState('');

  useEffect(() => {
    if (settings) {
      setForm({
        store_open: settings.store_open ?? true,
        min_order_value: settings.min_order_value ?? 0,
        delivery_enabled: settings.delivery_enabled ?? true,
        pickup_enabled: settings.pickup_enabled ?? false,
        payment_methods: (settings.payment_methods as string[]) || ['PIX', 'Dinheiro'],
        opening_hours: (settings.opening_hours as any) || { weekdays: '18:00 às 23:00', weekend: '18:00 às 22:00' },
        prep_time: settings.prep_time || '10 a 20 minutos',
        store_address: settings.store_address || '',
        store_phone: settings.store_phone || '',
      });
    }
  }, [settings]);

  const addPayment = () => {
    if (!newPayment.trim()) return;
    setForm(f => ({ ...f, payment_methods: [...f.payment_methods, newPayment.trim()] }));
    setNewPayment('');
  };

  const removePayment = (idx: number) => {
    setForm(f => ({ ...f, payment_methods: f.payment_methods.filter((_, i) => i !== idx) }));
  };

  const handleSave = async () => {
    if (!settings) return;
    try {
      await updateSettings.mutateAsync({
        id: settings.id,
        ...form,
      } as any);
      toast.success('Configurações da loja salvas!');
    } catch {
      toast.error('Erro ao salvar');
    }
  };

  if (isLoading) return <p className="text-muted-foreground">Carregando...</p>;

  return (
    <div className="space-y-4">
      {/* Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Store className="h-4 w-4 text-primary" /> Status da Loja
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Loja Aberta</p>
              <p className="text-xs text-muted-foreground">Quando fechada, clientes vêem "Loja fechada"</p>
            </div>
            <Switch checked={form.store_open} onCheckedChange={v => setForm(f => ({ ...f, store_open: v }))} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Pedido mínimo (R$)</label>
            <Input
              type="number"
              value={form.min_order_value}
              onChange={e => setForm(f => ({ ...f, min_order_value: parseFloat(e.target.value) || 0 }))}
              step="0.01"
              min="0"
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Delivery/Pickup */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Truck className="h-4 w-4 text-primary" /> Modalidade de Entrega
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">🛵 Entrega</span>
            <Switch checked={form.delivery_enabled} onCheckedChange={v => setForm(f => ({ ...f, delivery_enabled: v }))} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">🏪 Retirada no local</span>
            <Switch checked={form.pickup_enabled} onCheckedChange={v => setForm(f => ({ ...f, pickup_enabled: v }))} />
          </div>
        </CardContent>
      </Card>

      {/* Hours */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" /> Horário de Atendimento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Seg a Sáb</label>
            <Input
              value={form.opening_hours.weekdays}
              onChange={e => setForm(f => ({ ...f, opening_hours: { ...f.opening_hours, weekdays: e.target.value } }))}
              placeholder="18:00 às 23:00"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Domingo</label>
            <Input
              value={form.opening_hours.weekend}
              onChange={e => setForm(f => ({ ...f, opening_hours: { ...f.opening_hours, weekend: e.target.value } }))}
              placeholder="18:00 às 22:00"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Tempo de preparo</label>
            <Input
              value={form.prep_time}
              onChange={e => setForm(f => ({ ...f, prep_time: e.target.value }))}
              placeholder="10 a 20 minutos"
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Payment methods */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" /> Formas de Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {form.payment_methods.map((method, idx) => (
              <span key={idx} className="bg-muted text-foreground text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1">
                {method}
                <button onClick={() => removePayment(idx)} className="text-destructive hover:text-destructive/80">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newPayment}
              onChange={e => setNewPayment(e.target.value)}
              placeholder="Nova forma de pagamento"
              className="flex-1"
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addPayment())}
            />
            <Button variant="outline" size="sm" onClick={addPayment}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" /> Endereço da Loja
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Endereço completo</label>
            <Input
              value={form.store_address}
              onChange={e => setForm(f => ({ ...f, store_address: e.target.value }))}
              placeholder="Rua, número, bairro, cidade"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">WhatsApp da loja</label>
            <Input
              value={form.store_phone}
              onChange={e => setForm(f => ({ ...f, store_phone: e.target.value }))}
              placeholder="5541999999999"
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="w-full" disabled={updateSettings.isPending}>
        <Save className="h-4 w-4 mr-2" />
        {updateSettings.isPending ? 'Salvando...' : 'Salvar Configurações da Loja'}
      </Button>
    </div>
  );
};

export default StoreConfigManager;
