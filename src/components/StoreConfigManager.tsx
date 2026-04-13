import { useState, useEffect } from 'react';
import { useSiteSettings, useUpdateSiteSettings } from '@/hooks/useSiteSettings';
import { Save, Plus, X, Store, Clock, CreditCard, MapPin, Truck, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

const StoreConfigManager = () => {
  const { data: settings, isLoading } = useSiteSettings();
  const updateSettings = useUpdateSiteSettings();

  const [form, setForm] = useState({
    store_open: true,
    closed_message: 'Estamos fechados no momento. Volte em breve! 🦓',
    open_message: 'Estamos abertos! Faça seu pedido 🍹',
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
        closed_message: (settings as any).closed_message || 'Estamos fechados no momento. Volte em breve! 🦓',
        open_message: (settings as any).open_message || 'Estamos abertos! Faça seu pedido 🍹',
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
            <Store className="h-4 w-4 text-primary" /> Abrir ou Fechar a Loja
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {form.store_open ? '✅ Loja está ABERTA' : '🔴 Loja está FECHADA'}
              </p>
              <p className="text-xs text-muted-foreground">
                Ligue/desligue para abrir ou fechar sua loja para os clientes
              </p>
            </div>
            <Switch checked={form.store_open} onCheckedChange={v => setForm(f => ({ ...f, store_open: v }))} />
          </div>

          {/* Open message - always visible */}
          <div className={`border rounded-lg p-3 ${form.store_open ? 'border-green-500/50 bg-green-500/5' : 'border-border bg-muted/30'}`}>
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4 text-green-500" />
              <label className="text-xs font-semibold text-foreground">✅ Mensagem quando ABERTA:</label>
            </div>
            <Textarea
              value={form.open_message}
              onChange={e => setForm(f => ({ ...f, open_message: e.target.value }))}
              placeholder="Ex: Estamos abertos! Peça agora 🍹"
              rows={2}
              className="text-sm"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              O cliente vê isso quando a loja está aberta
            </p>
          </div>

          {/* Closed message - always visible */}
          <div className={`border rounded-lg p-3 ${!form.store_open ? 'border-destructive/50 bg-destructive/5' : 'border-border bg-muted/30'}`}>
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4 text-destructive" />
              <label className="text-xs font-semibold text-foreground">🔴 Mensagem quando FECHADA:</label>
            </div>
            <Textarea
              value={form.closed_message}
              onChange={e => setForm(f => ({ ...f, closed_message: e.target.value }))}
              placeholder="Ex: Estamos fechados. Volte amanhã!"
              rows={2}
              className="text-sm"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              O cliente vê isso quando a loja está fechada
            </p>
          </div>
              </div>
              <Textarea
                value={form.closed_message}
                onChange={e => setForm(f => ({ ...f, closed_message: e.target.value }))}
                placeholder="Ex: Voltamos amanhã às 18h! 🦓"
                rows={2}
                className="text-sm"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Essa mensagem aparece para os clientes quando sua loja está fechada
              </p>
            </div>
          )}

          <div>
            <label className="text-xs text-muted-foreground">
              💰 Valor mínimo do pedido (R$) — pedidos abaixo desse valor serão bloqueados
            </label>
            <Input
              type="number"
              value={form.min_order_value}
              onChange={e => setForm(f => ({ ...f, min_order_value: parseFloat(e.target.value) || 0 }))}
              step="0.01"
              min="0"
              className="mt-1"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Coloque 0 para não ter pedido mínimo
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Delivery/Pickup */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Truck className="h-4 w-4 text-primary" /> Como o cliente recebe o pedido
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-foreground">🛵 Entrega (motoboy leva até o cliente)</span>
            </div>
            <Switch checked={form.delivery_enabled} onCheckedChange={v => setForm(f => ({ ...f, delivery_enabled: v }))} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-foreground">🏪 Retirada (cliente busca na loja)</span>
            </div>
            <Switch checked={form.pickup_enabled} onCheckedChange={v => setForm(f => ({ ...f, pickup_enabled: v }))} />
          </div>
        </CardContent>
      </Card>

      {/* Hours */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" /> Horário de Funcionamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">📅 Segunda a Sábado</label>
            <Input
              value={form.opening_hours.weekdays}
              onChange={e => setForm(f => ({ ...f, opening_hours: { ...f.opening_hours, weekdays: e.target.value } }))}
              placeholder="18:00 às 23:00"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">📅 Domingo</label>
            <Input
              value={form.opening_hours.weekend}
              onChange={e => setForm(f => ({ ...f, opening_hours: { ...f.opening_hours, weekend: e.target.value } }))}
              placeholder="18:00 às 22:00"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">⏱️ Tempo de preparo (quanto demora pra preparar)</label>
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
            <CreditCard className="h-4 w-4 text-primary" /> Formas de Pagamento Aceitas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">Adicione ou remova as formas de pagamento que você aceita</p>
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
              placeholder="Ex: PIX, Cartão, Dinheiro..."
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
            <MapPin className="h-4 w-4 text-primary" /> Endereço e Contato da Loja
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">📍 Endereço completo (aparece para os clientes)</label>
            <Input
              value={form.store_address}
              onChange={e => setForm(f => ({ ...f, store_address: e.target.value }))}
              placeholder="Rua, número, bairro, cidade"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">📱 WhatsApp da loja (com DDD, sem espaços)</label>
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
