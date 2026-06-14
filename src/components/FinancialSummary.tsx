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
  const [partners, setPartners] = useState<Partner[]>(() => {
    try {
      const raw = localStorage.getItem(PARTNERS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return defaultPartners;
  });
  const [editingPartners, setEditingPartners] = useState(false);

  useEffect(() => {
    localStorage.setItem(PARTNERS_KEY, JSON.stringify(partners));
  }, [partners]);

  const totalPercent = partners.reduce((s, p) => s + (Number(p.percent) || 0), 0);

  const addPartner = () => setPartners([...partners, { id: Date.now().toString(), name: 'Novo', percent: 0 }]);
  const removePartner = (id: string) => setPartners(partners.filter(p => p.id !== id));
  const updatePartner = (id: string, field: 'name' | 'percent', value: string) => {
    setPartners(partners.map(p => p.id === id ? { ...p, [field]: field === 'percent' ? Number(value) || 0 : value } : p));
  };


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
      orderCount: filteredOrders.length,
    };
  }, [orders, transactions, customerOrders, period]);

  const periodLabels = {
    today: '📅 Hoje',
    month: '📅 Este Mês',
    all: '📅 Todo Período',
  };

  const inItems = [
    { label: '💰 Vendas (faturamento)', value: stats.salesRevenue, hint: `${stats.orderCount} ${stats.orderCount === 1 ? 'venda' : 'vendas'}` },
    { label: '🛵 Taxas de entrega recebidas', value: stats.deliveryFees },
    { label: '🔺 Reforços de caixa', value: stats.cashEntries },
  ].filter(i => i.value > 0);

  const outItems = [
    { label: '📦 Custo dos produtos vendidos', value: stats.salesCost, hint: 'O que você pagou pelos ingredientes' },
    { label: '💸 Despesas e sangrias', value: stats.cashExits },
  ].filter(i => i.value > 0);

  return (
    <div className="space-y-4 pb-6">
      {/* Period selector */}
      <div className="flex gap-2">
        {(['today', 'month', 'all'] as const).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              period === p
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border text-muted-foreground hover:bg-muted'
            }`}
          >
            {periodLabels[p]}
          </button>
        ))}
      </div>

      {/* Big summary */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ArrowUp className="h-4 w-4 text-green-500" />
              <p className="text-xs text-muted-foreground font-semibold">💰 ENTROU</p>
            </div>
            <p className="text-2xl font-bold text-green-500">{fmt(stats.totalIn)}</p>
          </CardContent>
        </Card>
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ArrowDown className="h-4 w-4 text-destructive" />
              <p className="text-xs text-muted-foreground font-semibold">💸 SAIU</p>
            </div>
            <p className="text-2xl font-bold text-destructive">{fmt(stats.totalOut)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Net profit */}
      <Card className={stats.netProfit >= 0 ? 'border-primary/30 bg-primary/5' : 'border-destructive/30 bg-destructive/5'}>
        <CardContent className="p-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <TrendingUp className="h-5 w-5 text-primary" />
            <p className="text-sm font-semibold text-foreground">🏆 LUCRO LÍQUIDO</p>
          </div>
          <p className={`text-4xl font-bold ${stats.netProfit >= 0 ? 'text-green-500' : 'text-destructive'}`}>
            {fmt(stats.netProfit)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Entrou − Saiu</p>
        </CardContent>
      </Card>

      {/* ENTRADAS — detail */}
      <Card className="border-green-500/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-green-600 dark:text-green-500">
            <ArrowUp className="h-4 w-4" /> O que ENTROU
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {inItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-3">Nenhuma entrada no período.</p>
          ) : inItems.map(item => (
            <div key={item.label} className="flex justify-between items-center py-2.5 border-b border-border last:border-0">
              <div>
                <p className="text-sm text-foreground">{item.label}</p>
                {item.hint && <p className="text-xs text-muted-foreground">{item.hint}</p>}
              </div>
              <span className="text-sm font-bold text-green-500">+ {fmt(item.value)}</span>
            </div>
          ))}
          <div className="flex justify-between items-center pt-3 mt-1 border-t-2 border-green-500/30">
            <span className="text-sm font-bold text-foreground">Total que entrou</span>
            <span className="text-base font-bold text-green-500">{fmt(stats.totalIn)}</span>
          </div>
        </CardContent>
      </Card>

      {/* SAÍDAS — detail */}
      <Card className="border-destructive/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-destructive">
            <ArrowDown className="h-4 w-4" /> O que SAIU
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {outItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-3">Nenhuma saída no período.</p>
          ) : outItems.map(item => (
            <div key={item.label} className="flex justify-between items-center py-2.5 border-b border-border last:border-0">
              <div>
                <p className="text-sm text-foreground">{item.label}</p>
                {item.hint && <p className="text-xs text-muted-foreground">{item.hint}</p>}
              </div>
              <span className="text-sm font-bold text-destructive">− {fmt(item.value)}</span>
            </div>
          ))}
          <div className="flex justify-between items-center pt-3 mt-1 border-t-2 border-destructive/30">
            <span className="text-sm font-bold text-foreground">Total que saiu</span>
            <span className="text-base font-bold text-destructive">{fmt(stats.totalOut)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Partner split */}
      <Card>
        <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> 💑 Divisão do Lucro
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => setEditingPartners(v => !v)}>
            {editingPartners ? 'Concluir' : 'Editar'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {editingPartners && (
            <div className="space-y-2">
              {partners.map(p => (
                <div key={p.id} className="flex items-center gap-2">
                  <Input
                    value={p.name}
                    onChange={e => updatePartner(p.id, 'name', e.target.value)}
                    placeholder="Nome"
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={p.percent}
                    onChange={e => updatePartner(p.id, 'percent', e.target.value)}
                    placeholder="%"
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                  <Button size="icon" variant="ghost" onClick={() => removePartner(p.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={addPartner} className="w-full">
                <Plus className="h-4 w-4 mr-1" /> Adicionar pessoa
              </Button>
              <p className={`text-xs text-center ${totalPercent === 100 ? 'text-green-500' : 'text-destructive'}`}>
                Total: {totalPercent}% {totalPercent !== 100 && '(precisa somar 100%)'}
              </p>
            </div>
          )}
          <div className={`grid gap-3 ${partners.length <= 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {partners.map(p => {
              const share = stats.netProfit * (p.percent / 100);
              return (
                <div key={p.id} className="bg-muted rounded-xl p-4 text-center">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">{p.name} ({p.percent}%)</p>
                  <p className={`text-xl font-bold ${share >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                    {fmt(share)}
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

export default FinancialSummary;
