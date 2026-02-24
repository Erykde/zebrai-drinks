import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Trophy } from 'lucide-react';

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" /> Programa de Fidelidade
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Clientes acumulam pontos automaticamente a cada pedido. A cada R$ 1 gasto = 1 ponto.
        </p>
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
                  <th className="text-left p-3">Telefone</th>
                  <th className="text-center p-3">Pedidos</th>
                  <th className="text-right p-3">Total Gasto</th>
                  <th className="text-right p-3">Pontos</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c, i) => (
                  <tr key={c.id} className="border-t border-border">
                    <td className="p-3 text-card-foreground">
                      {i < 3 && <span className="mr-1">{['🥇', '🥈', '🥉'][i]}</span>}
                      {c.customer_name || 'Sem nome'}
                    </td>
                    <td className="p-3 text-muted-foreground">{c.customer_phone}</td>
                    <td className="p-3 text-center text-muted-foreground">{c.order_count}</td>
                    <td className="p-3 text-right text-primary font-medium">{fmt(c.total_spent)}</td>
                    <td className="p-3 text-right font-bold text-primary">{c.points} pts</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LoyaltyManager;
