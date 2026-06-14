import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Trophy, Gift, Crown, Star } from 'lucide-react';

interface LoyaltyRow {
  id: string;
  customer_phone: string;
  customer_name: string;
  points: number;
  total_spent: number;
  order_count: number;
  updated_at: string;
}

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const TIERS = [
  { icon: Star, name: 'Bronze', range: '0 - 99 pts', perk: '5% de desconto na 5ª compra', color: 'text-amber-700' },
  { icon: Trophy, name: 'Prata', range: '100 - 299 pts', perk: 'Frete grátis em pedidos acima de R$ 60', color: 'text-slate-400' },
  { icon: Crown, name: 'Ouro', range: '300+ pts', perk: 'Drink grátis a cada R$ 200 gastos + acesso a promos VIP', color: 'text-primary' },
];

const LoyaltyManager = () => {
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

  const getTier = (points: number) => {
    if (points >= 300) return TIERS[2];
    if (points >= 100) return TIERS[1];
    return TIERS[0];
  };

  return (
    <div className="space-y-4">
      <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-amber-500/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" /> 🦓 Zebrai Club
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground mb-3">
            O <strong>Zebrai Club</strong> fideliza seus clientes: a cada <strong>R$ 1 gasto = 1 ponto</strong>. Use os níveis abaixo como recompensa e divulgue no WhatsApp para aumentar a recompra.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {TIERS.map(t => {
              const Icon = t.icon;
              return (
                <div key={t.name} className="rounded-xl border border-border bg-card/50 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`h-4 w-4 ${t.color}`} />
                    <p className="font-semibold text-sm text-foreground">{t.name}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{t.range}</p>
                  <p className="text-xs text-foreground mt-1 flex items-start gap-1">
                    <Gift className="h-3 w-3 text-primary mt-0.5 shrink-0" /> {t.perk}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

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
              <p className="text-xs text-muted-foreground mt-1">Os pontos serão acumulados automaticamente quando os clientes fizerem pedidos.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary text-secondary-foreground">
                  <tr>
                    <th className="text-left p-3">Cliente</th>
                    <th className="text-left p-3 hidden sm:table-cell">Telefone</th>
                    <th className="text-center p-3">Nível</th>
                    <th className="text-center p-3 hidden sm:table-cell">Pedidos</th>
                    <th className="text-right p-3">Total Gasto</th>
                    <th className="text-right p-3">Pontos</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c, i) => {
                    const tier = getTier(c.points);
                    const Icon = tier.icon;
                    return (
                      <tr key={c.id} className="border-t border-border">
                        <td className="p-3 text-card-foreground">
                          {i < 3 && <span className="mr-1">{['🥇', '🥈', '🥉'][i]}</span>}
                          {c.customer_name || 'Sem nome'}
                        </td>
                        <td className="p-3 text-muted-foreground hidden sm:table-cell">{c.customer_phone}</td>
                        <td className="p-3 text-center">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium ${tier.color}`}>
                            <Icon className="h-3 w-3" /> {tier.name}
                          </span>
                        </td>
                        <td className="p-3 text-center text-muted-foreground hidden sm:table-cell">{c.order_count}</td>
                        <td className="p-3 text-right text-primary font-medium">{fmt(c.total_spent)}</td>
                        <td className="p-3 text-right font-bold text-primary">{c.points} pts</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LoyaltyManager;
