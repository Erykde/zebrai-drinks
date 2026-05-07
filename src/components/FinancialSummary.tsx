import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, TrendingDown, ArrowDown, ArrowUp, Users, Wallet, Plus, Trash2 } from 'lucide-react';

interface Partner {
  id: string;
  name: string;
  percent: number;
}

const PARTNERS_KEY = 'zebrai_partners_v1';
const defaultPartners: Partner[] = [
  { id: '1', name: 'Você', percent: 50 },
  { id: '2', name: 'Geovana', percent: 50 },
];

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface OrderRow {
  total: number;
  cost_price: number;
  quantity: number;
  created_at: string;
}

interface CashTransaction {
  type: string;
  amount: number;
  category: string;
  created_at: string;
}

const FinancialSummary = () => {
  const [period, setPeriod] = useState<'today' | 'month' | 'all'>('month');

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: async (): Promise<OrderRow[]> => {
      const { data, error } = await supabase.from('orders').select('total, cost_price, quantity, created_at');
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: customerOrders = [] } = useQuery({
    queryKey: ['customer-orders-financial'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_orders')
        .select('total, delivery_fee, created_at, status');
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['cash-transactions-all'],
    queryFn: async (): Promise<CashTransaction[]> => {
      const { data, error } = await supabase.from('cash_transactions').select('type, amount, category, created_at');
      if (error) throw error;
      return data ?? [];
    },
  });

  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const monthStr = now.toISOString().slice(0, 7);

    const filterByPeriod = <T extends { created_at: string }>(arr: T[]) => {
      if (period === 'today') return arr.filter(i => i.created_at.slice(0, 10) === todayStr);
      if (period === 'month') return arr.filter(i => i.created_at.slice(0, 7) === monthStr);
      return arr;
    };

    const filteredOrders = filterByPeriod(orders);
    const filteredTx = filterByPeriod(transactions);
    const filteredCustomerOrders = filterByPeriod(customerOrders);

    // Revenue from sales
    const salesRevenue = filteredOrders.reduce((s, o) => s + o.total, 0);
    const salesCost = filteredOrders.reduce((s, o) => s + o.cost_price * o.quantity, 0);

    // Delivery fees collected
    const deliveryFees = filteredCustomerOrders
      .filter((o: any) => o.status !== 'cancelled')
      .reduce((s: number, o: any) => s + Number(o.delivery_fee), 0);

    // Cash register entries/exits
    const cashEntries = filteredTx.filter(t => t.type === 'entry' && t.category !== 'venda').reduce((s, t) => s + t.amount, 0);
    const cashExits = filteredTx.filter(t => t.type === 'exit').reduce((s, t) => s + t.amount, 0);

    // Expenses from cash register
    const expenses = filteredTx.filter(t => t.type === 'exit' && (t.category === 'despesa' || t.category === 'sangria')).reduce((s, t) => s + t.amount, 0);

    // Total in: sales + delivery fees + cash entries
    const totalIn = salesRevenue + deliveryFees + cashEntries;
    // Total out: costs + expenses
    const totalOut = salesCost + cashExits;
    // Net profit
    const netProfit = totalIn - totalOut;
    // Gross profit (just sales)
    const grossProfit = salesRevenue - salesCost;

    // Partner split 50/50
    const yourShare = netProfit / 2;
    const geovanaShare = netProfit / 2;

    return {
      salesRevenue,
      salesCost,
      deliveryFees,
      cashEntries,
      cashExits,
      expenses,
      totalIn,
      totalOut,
      grossProfit,
      netProfit,
      yourShare,
      geovanaShare,
      orderCount: filteredOrders.length,
    };
  }, [orders, transactions, customerOrders, period]);

  const periodLabels = {
    today: '📅 Hoje',
    month: '📅 Este Mês',
    all: '📅 Todo Período',
  };

  return (
    <div className="space-y-4">
      {/* Period selector */}
      <div className="flex gap-2">
        {(['today', 'month', 'all'] as const).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === p
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border text-muted-foreground hover:bg-muted'
            }`}
          >
            {periodLabels[p]}
          </button>
        ))}
      </div>

      {/* Main summary */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ArrowUp className="h-4 w-4 text-green-500" />
              <p className="text-xs text-muted-foreground font-semibold">💰 ENTROU</p>
            </div>
            <p className="text-xl font-bold text-green-500">{fmt(stats.totalIn)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{stats.orderCount} vendas</p>
          </CardContent>
        </Card>
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ArrowDown className="h-4 w-4 text-destructive" />
              <p className="text-xs text-muted-foreground font-semibold">💸 SAIU</p>
            </div>
            <p className="text-xl font-bold text-destructive">{fmt(stats.totalOut)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Custos + despesas</p>
          </CardContent>
        </Card>
      </div>

      {/* Net profit */}
      <Card className={stats.netProfit >= 0 ? 'border-primary/30' : 'border-destructive/30'}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-5 w-5 text-primary" />
            <p className="text-sm font-semibold text-foreground">🏆 LUCRO LÍQUIDO</p>
          </div>
          <p className={`text-3xl font-bold ${stats.netProfit >= 0 ? 'text-green-500' : 'text-destructive'}`}>
            {fmt(stats.netProfit)}
          </p>
        </CardContent>
      </Card>

      {/* Partner split */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> 💑 Divisão do Lucro (50% / 50%)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted rounded-xl p-4 text-center">
              <p className="text-xs font-semibold text-muted-foreground mb-1">🧑 Você</p>
              <p className={`text-xl font-bold ${stats.yourShare >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                {fmt(stats.yourShare)}
              </p>
            </div>
            <div className="bg-muted rounded-xl p-4 text-center">
              <p className="text-xs font-semibold text-muted-foreground mb-1">👩 Geovana</p>
              <p className={`text-xl font-bold ${stats.geovanaShare >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                {fmt(stats.geovanaShare)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" /> 📊 Detalhamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between items-center py-2 border-b border-border">
            <span className="text-sm text-foreground">💰 Vendas (faturamento)</span>
            <span className="text-sm font-semibold text-green-500">{fmt(stats.salesRevenue)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-border">
            <span className="text-sm text-foreground">📦 Custo dos produtos</span>
            <span className="text-sm font-semibold text-destructive">- {fmt(stats.salesCost)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-border">
            <span className="text-sm text-foreground">🛵 Taxas de entrega</span>
            <span className="text-sm font-semibold text-green-500">{fmt(stats.deliveryFees)}</span>
          </div>
          {stats.cashEntries > 0 && (
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-foreground">🔺 Reforço de caixa</span>
              <span className="text-sm font-semibold text-green-500">{fmt(stats.cashEntries)}</span>
            </div>
          )}
          {stats.cashExits > 0 && (
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-foreground">🔻 Saídas de caixa</span>
              <span className="text-sm font-semibold text-destructive">- {fmt(stats.cashExits)}</span>
            </div>
          )}
          <div className="flex justify-between items-center py-2 pt-3">
            <span className="text-sm font-bold text-foreground">🏆 Lucro final</span>
            <span className={`text-lg font-bold ${stats.netProfit >= 0 ? 'text-green-500' : 'text-destructive'}`}>
              {fmt(stats.netProfit)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialSummary;
