import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Ticket, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order_value: number;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

const CouponsManager = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: '',
    min_order_value: '0',
    max_uses: '',
    expires_at: '',
  });
  const [saving, setSaving] = useState(false);

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ['coupons'],
    queryFn: async (): Promise<Coupon[]> => {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Coupon[];
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !form.discount_value) {
      toast.error('Preencha código e valor do desconto');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('coupons').insert({
      code: form.code.trim().toUpperCase(),
      discount_type: form.discount_type,
      discount_value: parseFloat(form.discount_value),
      min_order_value: parseFloat(form.min_order_value) || 0,
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      expires_at: form.expires_at || null,
    } as any);
    setSaving(false);
    if (error) {
      toast.error(error.message.includes('unique') ? 'Código já existe!' : 'Erro ao criar cupom');
      return;
    }
    toast.success('Cupom criado!');
    setForm({ code: '', discount_type: 'percentage', discount_value: '', min_order_value: '0', max_uses: '', expires_at: '' });
    setShowForm(false);
    queryClient.invalidateQueries({ queryKey: ['coupons'] });
  };

  const toggleActive = async (coupon: Coupon) => {
    await supabase.from('coupons').update({ is_active: !coupon.is_active } as any).eq('id', coupon.id);
    queryClient.invalidateQueries({ queryKey: ['coupons'] });
    toast.success(coupon.is_active ? 'Cupom desativado' : 'Cupom ativado');
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm('Remover este cupom?')) return;
    await supabase.from('coupons').delete().eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['coupons'] });
    toast.success('Cupom removido');
  };

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-primary" /> Cupons de Desconto
          </span>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1 text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:opacity-90"
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? 'Cancelar' : 'Novo Cupom'}
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {showForm && (
          <form onSubmit={handleSubmit} className="border border-border rounded-lg p-4 mb-4 space-y-3 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                value={form.code}
                onChange={e => setForm({ ...form, code: e.target.value })}
                placeholder="Código (ex: PROMO10)"
                className="px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm uppercase"
                required
                maxLength={20}
              />
              <select
                value={form.discount_type}
                onChange={e => setForm({ ...form, discount_type: e.target.value as any })}
                className="px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm"
              >
                <option value="percentage">% Porcentagem</option>
                <option value="fixed">R$ Valor fixo</option>
              </select>
              <input
                type="number"
                value={form.discount_value}
                onChange={e => setForm({ ...form, discount_value: e.target.value })}
                placeholder={form.discount_type === 'percentage' ? 'Desconto (%)' : 'Desconto (R$)'}
                className="px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm"
                required
                min="0"
                step="0.01"
              />
              <input
                type="number"
                value={form.min_order_value}
                onChange={e => setForm({ ...form, min_order_value: e.target.value })}
                placeholder="Pedido mínimo (R$)"
                className="px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm"
                min="0"
                step="0.01"
              />
              <input
                type="number"
                value={form.max_uses}
                onChange={e => setForm({ ...form, max_uses: e.target.value })}
                placeholder="Máximo de usos (vazio = ilimitado)"
                className="px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm"
                min="1"
              />
              <input
                type="date"
                value={form.expires_at}
                onChange={e => setForm({ ...form, expires_at: e.target.value })}
                className="px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Criar Cupom'}
            </button>
          </form>
        )}

        {isLoading ? (
          <p className="text-muted-foreground text-sm text-center py-4">Carregando...</p>
        ) : coupons.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">Nenhum cupom criado ainda.</p>
        ) : (
          <div className="space-y-2">
            {coupons.map(c => (
              <div key={c.id} className={`flex items-center justify-between p-3 rounded-lg border ${c.is_active ? 'border-border bg-card' : 'border-border/50 bg-muted/50 opacity-60'}`}>
                <div>
                  <span className="font-mono font-bold text-primary text-sm">{c.code}</span>
                  <p className="text-xs text-muted-foreground">
                    {c.discount_type === 'percentage' ? `${c.discount_value}% off` : `${fmt(c.discount_value)} off`}
                    {c.min_order_value > 0 && ` · Mín: ${fmt(c.min_order_value)}`}
                    {c.max_uses && ` · ${c.used_count}/${c.max_uses} usos`}
                    {c.expires_at && ` · Expira: ${new Date(c.expires_at).toLocaleDateString('pt-BR')}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(c)}
                    className={`text-xs px-2 py-1 rounded ${c.is_active ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'}`}
                  >
                    {c.is_active ? 'Ativo' : 'Inativo'}
                  </button>
                  <button onClick={() => deleteCoupon(c.id)} className="p-1 text-destructive hover:bg-destructive/10 rounded">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CouponsManager;
