import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Megaphone, Plus, Trash2, X, Send, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface Campaign {
  id: string;
  title: string;
  message: string;
  target_type: string;
  status: string;
  sent_at: string | null;
  created_at: string;
}

interface LoyaltyRow {
  customer_phone: string;
  customer_name: string;
  total_spent: number;
  order_count: number;
  updated_at: string;
}

const CampaignsManager = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', target_type: 'all' });
  const [saving, setSaving] = useState(false);
  const [showContacts, setShowContacts] = useState<string | null>(null);

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async (): Promise<Campaign[]> => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Campaign[];
    },
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['loyalty-points'],
    queryFn: async (): Promise<LoyaltyRow[]> => {
      const { data, error } = await supabase
        .from('loyalty_points')
        .select('*')
        .order('total_spent', { ascending: false });
      if (error) throw error;
      return (data ?? []) as LoyaltyRow[];
    },
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      toast.error('Preencha título e mensagem');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('campaigns').insert({
      title: form.title.trim(),
      message: form.message.trim(),
      target_type: form.target_type,
    } as any);
    setSaving(false);
    if (error) { toast.error('Erro ao criar campanha'); return; }
    toast.success('Campanha criada!');
    setForm({ title: '', message: '', target_type: 'all' });
    setShowForm(false);
    queryClient.invalidateQueries({ queryKey: ['campaigns'] });
  };

  const generateWhatsAppLinks = (campaign: Campaign) => {
    const targets = customers.filter(c => {
      if (campaign.target_type === 'all') return true;
      if (campaign.target_type === 'top_spenders') return c.total_spent > 100;
      if (campaign.target_type === 'inactive') {
        const lastOrder = new Date(c.updated_at);
        const daysSince = (Date.now() - lastOrder.getTime()) / (1000 * 60 * 60 * 24);
        return daysSince > 30;
      }
      return true;
    });
    setShowContacts(campaign.id);
    return targets;
  };

  const copyMessage = (message: string) => {
    navigator.clipboard.writeText(message);
    toast.success('Mensagem copiada!');
  };

  const openWhatsApp = (phone: string, message: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm('Remover esta campanha?')) return;
    await supabase.from('campaigns').delete().eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    toast.success('Campanha removida');
  };

  const targetLabels: Record<string, string> = {
    all: 'Todos os clientes',
    inactive: 'Clientes inativos (+30 dias)',
    top_spenders: 'Top compradores (>R$100)',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" /> Campanhas
          </span>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1 text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:opacity-90"
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? 'Cancelar' : 'Nova Campanha'}
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {showForm && (
          <form onSubmit={handleCreate} className="border border-border rounded-lg p-4 mb-4 space-y-3 animate-fade-in">
            <input
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Título da campanha"
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm"
              required
              maxLength={100}
            />
            <textarea
              value={form.message}
              onChange={e => setForm({ ...form, message: e.target.value })}
              placeholder="Mensagem que será enviada (ex: Oi {nome}! Temos uma promoção especial pra você 🎉)"
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm h-24 resize-none"
              required
              maxLength={500}
            />
            <select
              value={form.target_type}
              onChange={e => setForm({ ...form, target_type: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm"
            >
              <option value="all">Todos os clientes</option>
              <option value="inactive">Clientes inativos (+30 dias)</option>
              <option value="top_spenders">Top compradores (&gt;R$100)</option>
            </select>
            <button type="submit" disabled={saving} className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">
              {saving ? 'Salvando...' : 'Criar Campanha'}
            </button>
          </form>
        )}

        {campaigns.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">Nenhuma campanha criada.</p>
        ) : (
          <div className="space-y-3">
            {campaigns.map(c => (
              <div key={c.id} className="border border-border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-card-foreground text-sm">{c.title}</h4>
                    <p className="text-xs text-muted-foreground">{targetLabels[c.target_type]} · {new Date(c.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => copyMessage(c.message)}
                      className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded"
                      title="Copiar mensagem"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => generateWhatsAppLinks(c)}
                      className="p-1.5 text-green-500 hover:bg-green-500/10 rounded"
                      title="Enviar via WhatsApp"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteCampaign(c.id)}
                      className="p-1.5 text-destructive hover:bg-destructive/10 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground bg-muted rounded p-2">{c.message}</p>

                {showContacts === c.id && (
                  <div className="mt-3 border-t border-border pt-3 space-y-2 animate-fade-in">
                    <p className="text-xs font-medium text-card-foreground">Enviar para:</p>
                    {customers.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Nenhum contato encontrado. Os contatos são registrados quando clientes fazem pedidos.</p>
                    ) : (
                      customers.map(ct => (
                        <div key={ct.customer_phone} className="flex items-center justify-between py-1">
                          <span className="text-sm text-card-foreground">{ct.customer_name || ct.customer_phone}</span>
                          <button
                            onClick={() => openWhatsApp(ct.customer_phone, c.message.replace('{nome}', ct.customer_name || 'Cliente'))}
                            className="text-xs bg-green-500 text-white px-3 py-1 rounded-full hover:bg-green-600"
                          >
                            📲 Enviar
                          </button>
                        </div>
                      ))
                    )}
                    <button onClick={() => setShowContacts(null)} className="text-xs text-muted-foreground hover:underline">Fechar</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CampaignsManager;
