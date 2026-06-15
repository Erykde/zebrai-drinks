import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Gift, Crown, Star, Trophy, Save, Trash2, Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useSiteSettings, useUpdateSiteSettings } from '@/hooks/useSiteSettings';
import { toast } from 'sonner';

interface LoyaltyRow {
  id: string;
  customer_phone: string;
  customer_name: string;
  points: number;
  total_spent: number;
  order_count: number;
  updated_at: string;
}

interface Tier {
  name: string;
  min_points: number;
  perk: string;
}

const DEFAULT_TIERS: Tier[] = [
  { name: 'Bronze', min_points: 0, perk: '5% de desconto na 5ª compra' },
  { name: 'Prata', min_points: 5, perk: 'Frete grátis em pedidos acima de R$ 60' },
  { name: 'Ouro', min_points: 15, perk: 'Drink grátis a cada R$ 200 + promos VIP' },
];

const DEFAULT_DESCRIPTION =
  'O Zebrai Club fideliza seus clientes: a cada compra eles acumulam pontos e desbloqueiam recompensas. Divulgue no WhatsApp para aumentar a recompra.';

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const tierIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('ouro') || n.includes('gold')) return Crown;
  if (n.includes('prata') || n.includes('silver')) return Trophy;
  return Star;
};
const tierColor = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('ouro') || n.includes('gold')) return 'text-primary';
  if (n.includes('prata') || n.includes('silver')) return 'text-slate-400';
  return 'text-amber-700';
};

const LoyaltyManager = () => {
  const queryClient = useQueryClient();
  const { data: settings } = useSiteSettings();
  const updateSettings = useUpdateSiteSettings();

  const [divisor, setDivisor] = useState<number>(50);
  const [description, setDescription] = useState<string>(DEFAULT_DESCRIPTION);
  const [tiers, setTiers] = useState<Tier[]>(DEFAULT_TIERS);

  useEffect(() => {
    if (!settings) return;
    setDivisor(Number(settings.loyalty_divisor) > 0 ? Number(settings.loyalty_divisor) : 50);
    setDescription(settings.loyalty_description || DEFAULT_DESCRIPTION);
    const t = (settings.loyalty_tiers as Tier[]) || DEFAULT_TIERS;
    setTiers(Array.isArray(t) && t.length ? t : DEFAULT_TIERS);
  }, [settings]);

  const { data: customers = [], isLoading } = useQuery({
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

  const getTier = (points: number): Tier => {
    const sorted = [...tiers].sort((a, b) => b.min_points - a.min_points);
    return sorted.find(t => points >= t.min_points) ?? tiers[0] ?? DEFAULT_TIERS[0];
  };

  const handleSaveConfig = async () => {
    if (!settings) return;
    try {
      await updateSettings.mutateAsync({
        id: settings.id,
        loyalty_divisor: divisor,
        loyalty_description: description,
        loyalty_tiers: tiers,
      } as any);
      toast.success('Zebrai Club atualizado!');
    } catch {
      toast.error('Erro ao salvar');
    }
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (!confirm(`Remover ${name || 'este membro'} do Zebrai Club?`)) return;
    const { error } = await supabase.from('loyalty_points').delete().eq('id', id);
    if (error) {
      toast.error('Erro ao remover');
      return;
    }
    toast.success('Membro removido');
    queryClient.invalidateQueries({ queryKey: ['loyalty-points'] });
  };

  const updateTier = (idx: number, patch: Partial<Tier>) =>
    setTiers(prev => prev.map((t, i) => (i === idx ? { ...t, ...patch } : t)));
  const addTier = () =>
    setTiers(prev => [...prev, { name: 'Novo nível', min_points: 0, perk: '' }]);
  const removeTier = (idx: number) =>
    setTiers(prev => prev.filter((_, i) => i !== idx));

  return (
    <div className="space-y-4">
      {/* Editable program rules */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-amber-500/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" /> 🦓 Zebrai Club — Configurar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-foreground">
              💰 A cada R$ <strong>quanto gasto</strong> o cliente ganha 1 ponto?
            </label>
            <Input
              type="number"
              value={divisor}
              onChange={e => setDivisor(Math.max(1, parseFloat(e.target.value) || 1))}
              step="1"
              min="1"
              className="mt-1"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Atual: 1 ponto a cada <strong>R$ {divisor.toFixed(2)}</strong> gastos. Ex.: pedido de R$ 100 = {Math.floor(100 / divisor)} pontos.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground">📣 Texto de marketing (aparece para você organizar a divulgação)</label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="mt-1 text-sm"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-foreground">🏆 Níveis e recompensas</label>
              <Button type="button" variant="outline" size="sm" onClick={addTier}>
                <Plus className="h-3 w-3 mr-1" /> Novo nível
              </Button>
            </div>
            <div className="space-y-2">
              {tiers.map((t, i) => (
                <div key={i} className="rounded-lg border border-border bg-card/50 p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={t.name}
                      onChange={e => updateTier(i, { name: e.target.value })}
                      placeholder="Nome do nível (Bronze, Prata...)"
                      className="text-sm"
                    />
                    <Input
                      type="number"
                      value={t.min_points}
                      onChange={e => updateTier(i, { min_points: parseInt(e.target.value) || 0 })}
                      placeholder="Pontos mínimos"
                      className="text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={t.perk}
                      onChange={e => updateTier(i, { perk: e.target.value })}
                      placeholder="Recompensa (ex: 5% off na próxima compra)"
                      className="text-sm flex-1"
                    />
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeTier(i)} className="text-destructive">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={handleSaveConfig} className="w-full" disabled={updateSettings.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {updateSettings.isPending ? 'Salvando...' : 'Salvar Zebrai Club'}
          </Button>
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Membros do Zebrai Club
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm text-center py-4">Carregando...</p>
          ) : customers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">Nenhum cliente registrado ainda.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {customers.map((c, i) => {
                const tier = getTier(c.points);
                const Icon = tierIcon(tier.name);
                return (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card/50"
                  >
                    <div className="text-2xl w-8 text-center">
                      {i < 3 ? ['🥇', '🥈', '🥉'][i] : '•'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">
                        {c.customer_name || 'Sem nome'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{c.customer_phone}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${tierColor(tier.name)}`}>
                          <Icon className="h-3 w-3" /> {tier.name}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {c.order_count} pedido(s) • {fmt(c.total_spent)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary text-sm">{c.points} pts</p>
                      <button
                        onClick={() => handleDeleteMember(c.id, c.customer_name)}
                        className="mt-1 text-[11px] text-destructive hover:underline inline-flex items-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" /> Remover
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Marketing preview of tiers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Gift className="h-4 w-4 text-primary" /> Como divulgar para os clientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground mb-3 whitespace-pre-wrap">{description}</p>
          <p className="text-xs text-muted-foreground mb-2">
            👉 1 ponto a cada R$ {divisor.toFixed(2)} gastos.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {tiers.map(t => {
              const Icon = tierIcon(t.name);
              return (
                <div key={t.name} className="rounded-xl border border-border bg-card/50 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`h-4 w-4 ${tierColor(t.name)}`} />
                    <p className="font-semibold text-sm text-foreground">{t.name}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">A partir de {t.min_points} pts</p>
                  <p className="text-xs text-foreground mt-1 flex items-start gap-1">
                    <Gift className="h-3 w-3 text-primary mt-0.5 shrink-0" /> {t.perk}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoyaltyManager;
