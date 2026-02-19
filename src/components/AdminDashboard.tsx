import { useMemo } from 'react';
import {
  DollarSign, TrendingUp, TrendingDown, BarChart3, Package,
  AlertTriangle, ShoppingCart, Users, ArrowUpRight, ArrowDownRight,
  Truck, Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DbProduct } from '@/hooks/useProducts';

interface OrderRow {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  cost_price: number;
  mixer: string | null;
  total: number;
  created_at: string;
}

interface AdminDashboardProps {
  orders: OrderRow[];
  products: DbProduct[];
  deliveryZones: any[];
}

const LOW_STOCK_THRESHOLD = 10;

// Items the owner wants to track specifically
const TRACKED_ITEMS = [
  { label: 'Monster', keywords: ['monster'] },
  { label: 'Whisky', keywords: ['jack daniel', 'ballantines', 'red label', 'passaport'] },
  { label: 'Gin', keywords: ['gin'] },
  { label: 'Maçã Verde', keywords: ['maçã verde'] },
  { label: 'Red Horse', keywords: ['red horse'] },
  { label: 'Refrigerante', keywords: ['refrigerante', 'coca', 'guaraná', 'fanta'] },
  { label: 'Smirnoff', keywords: ['smirnoff'] },
  { label: 'Red Bull', keywords: ['red bull'] },
];

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const AdminDashboard = ({ orders, products, deliveryZones }: AdminDashboardProps) => {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const monthStr = now.toISOString().slice(0, 7);

  const stats = useMemo(() => {
    const today = orders.filter(o => o.created_at.slice(0, 10) === todayStr);
    const thisMonth = orders.filter(o => o.created_at.slice(0, 7) === monthStr);

    // Yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    const yesterdayOrders = orders.filter(o => o.created_at.slice(0, 10) === yesterdayStr);

    // Last month
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
    const lastMonthOrders = orders.filter(o => o.created_at.slice(0, 7) === lastMonthStr);

    const calcStats = (arr: OrderRow[]) => {
      const revenue = arr.reduce((s, o) => s + o.total, 0);
      const cost = arr.reduce((s, o) => s + o.cost_price * o.quantity, 0);
      const profit = revenue - cost;
      const qty = arr.reduce((s, o) => s + o.quantity, 0);
      // Group by created_at minute as proxy for "order session"
      const uniqueOrders = new Set(arr.map(o => o.created_at.slice(0, 16))).size || 1;
      const ticket = revenue / (uniqueOrders || 1);
      return { revenue, cost, profit, qty, ticket, count: arr.length, uniqueOrders };
    };

    return {
      today: calcStats(today),
      yesterday: calcStats(yesterdayOrders),
      thisMonth: calcStats(thisMonth),
      lastMonth: calcStats(lastMonthOrders),
      all: calcStats(orders),
    };
  }, [orders, todayStr, monthStr]);

  // Stock tracking
  const trackedStock = useMemo(() => {
    return TRACKED_ITEMS.map(item => {
      const matched = products.filter(p =>
        item.keywords.some(k => p.name.toLowerCase().includes(k))
      );
      const totalStock = matched.reduce((s, p) => s + (p.stock ?? 0), 0);
      return { ...item, stock: totalStock, products: matched };
    });
  }, [products]);

  const lowStockProducts = useMemo(() =>
    products.filter(p => (p.stock ?? 0) <= LOW_STOCK_THRESHOLD),
    [products]
  );

  // Top selling products
  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    orders.forEach(o => {
      const existing = map.get(o.product_name) || { name: o.product_name, qty: 0, revenue: 0 };
      existing.qty += o.quantity;
      existing.revenue += o.total;
      map.set(o.product_name, existing);
    });
    return [...map.values()].sort((a, b) => b.qty - a.qty).slice(0, 10);
  }, [orders]);

  const pctChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  return (
    <div className="space-y-6">
      {/* === KPIs Principais === */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<DollarSign className="h-5 w-5" />}
          label="Vendas Hoje"
          value={fmt(stats.today.revenue)}
          sub={`Ontem: ${fmt(stats.yesterday.revenue)}`}
          change={pctChange(stats.today.revenue, stats.yesterday.revenue)}
        />
        <KpiCard
          icon={<DollarSign className="h-5 w-5" />}
          label="Vendas no Mês"
          value={fmt(stats.thisMonth.revenue)}
          sub={`Mês passado: ${fmt(stats.lastMonth.revenue)}`}
          change={pctChange(stats.thisMonth.revenue, stats.lastMonth.revenue)}
        />
        <KpiCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Lucro Real (Mês)"
          value={fmt(stats.thisMonth.profit)}
          sub={`Custo: ${fmt(stats.thisMonth.cost)}`}
          color="text-green-500"
        />
        <KpiCard
          icon={<ShoppingCart className="h-5 w-5" />}
          label="Ticket Médio"
          value={fmt(stats.thisMonth.ticket)}
          sub={`${stats.thisMonth.uniqueOrders} pedidos`}
        />
      </div>

      {/* === Lucro Detalhado === */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lucro Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-display text-green-500">{fmt(stats.today.profit)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Faturamento: {fmt(stats.today.revenue)} · Custo: {fmt(stats.today.cost)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lucro no Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-display text-green-500">{fmt(stats.thisMonth.profit)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Faturamento: {fmt(stats.thisMonth.revenue)} · Custo: {fmt(stats.thisMonth.cost)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Margem de Lucro</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-display text-primary">
              {stats.thisMonth.revenue > 0
                ? `${((stats.thisMonth.profit / stats.thisMonth.revenue) * 100).toFixed(1)}%`
                : '—'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Lucro total: {fmt(stats.all.profit)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* === Crescimento === */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" /> Crescimento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ComparisonRow
              label="Hoje vs Ontem"
              current={stats.today.revenue}
              previous={stats.yesterday.revenue}
              currentLabel="Hoje"
              previousLabel="Ontem"
            />
            <ComparisonRow
              label="Este Mês vs Mês Passado"
              current={stats.thisMonth.revenue}
              previous={stats.lastMonth.revenue}
              currentLabel="Este mês"
              previousLabel="Mês passado"
            />
          </div>
        </CardContent>
      </Card>

      {/* === Estoque Monitorado === */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" /> Estoque Monitorado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {trackedStock.map(item => (
              <div
                key={item.label}
                className={`rounded-lg border p-3 text-center transition-colors ${
                  item.stock <= LOW_STOCK_THRESHOLD
                    ? 'border-destructive/50 bg-destructive/5'
                    : 'border-border bg-card'
                }`}
              >
                <p className="text-sm font-medium text-card-foreground">{item.label}</p>
                <p className={`text-2xl font-display mt-1 ${
                  item.stock <= LOW_STOCK_THRESHOLD ? 'text-destructive' : 'text-primary'
                }`}>
                  {item.stock}
                </p>
                <p className="text-xs text-muted-foreground">unidades</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* === Alerta de Estoque Baixo === */}
      {lowStockProducts.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Alerta de Estoque Baixo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockProducts.map(p => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm text-card-foreground">
                    {p.image_emoji} {p.name}
                    <span className="text-muted-foreground ml-2 text-xs">({p.category})</span>
                  </span>
                  <span className={`font-display text-lg ${
                    (p.stock ?? 0) === 0 ? 'text-destructive' : 'text-orange-500'
                  }`}>
                    {p.stock ?? 0} un
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* === Top Produtos === */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" /> Top 10 Produtos Mais Vendidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topProducts.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">Nenhuma venda registrada.</p>
          ) : (
            <div className="space-y-2">
              {topProducts.map((p, i) => {
                const maxQty = topProducts[0]?.qty || 1;
                return (
                  <div key={p.name} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-muted-foreground w-5 text-right">
                      {i + 1}º
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-sm font-medium text-card-foreground truncate">{p.name}</span>
                        <span className="text-xs text-muted-foreground ml-2 whitespace-nowrap">
                          {p.qty} un · {fmt(p.revenue)}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${(p.qty / maxQty) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* === Entregas === */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" /> Regiões de Entrega
          </CardTitle>
        </CardHeader>
        <CardContent>
          {deliveryZones.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">Nenhuma região cadastrada.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {deliveryZones.filter(z => z.is_active).map(z => (
                <div key={z.id} className="rounded-lg border border-border bg-card p-3">
                  <p className="font-medium text-sm text-card-foreground">{z.zone_name}</p>
                  <p className="text-xs text-muted-foreground">{z.min_km}-{z.max_km} km</p>
                  <p className="text-lg font-display text-primary mt-1">
                    {Number(z.fee) === 0 ? 'Grátis' : fmt(Number(z.fee))}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* === Últimas Vendas === */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Últimas Vendas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {orders.length === 0 ? (
            <p className="text-muted-foreground text-center py-8 px-6">Nenhuma venda registrada ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary text-secondary-foreground">
                  <tr>
                    <th className="text-left p-3">Produto</th>
                    <th className="text-center p-3">Qtd</th>
                    <th className="text-right p-3">Total</th>
                    <th className="text-right p-3">Lucro</th>
                    <th className="text-right p-3">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 50).map(o => (
                    <tr key={o.id} className="border-t border-border">
                      <td className="p-3 text-card-foreground">
                        {o.product_name}{o.mixer ? ` + ${o.mixer}` : ''}
                      </td>
                      <td className="p-3 text-center text-muted-foreground">{o.quantity}</td>
                      <td className="p-3 text-right text-primary font-medium">{fmt(o.total)}</td>
                      <td className="p-3 text-right text-green-500 font-medium">
                        {fmt(o.total - o.cost_price * o.quantity)}
                      </td>
                      <td className="p-3 text-right text-muted-foreground text-xs">
                        {new Date(o.created_at).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// === Sub-components ===

const KpiCard = ({
  icon, label, value, sub, change, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  change?: number;
  color?: string;
}) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className={`font-display text-2xl ${color || 'text-card-foreground'}`}>{value}</p>
      <div className="flex items-center gap-2 mt-1">
        {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
        {change !== undefined && change !== 0 && (
          <span className={`text-xs font-medium flex items-center gap-0.5 ${
            change > 0 ? 'text-green-500' : 'text-destructive'
          }`}>
            {change > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(change).toFixed(0)}%
          </span>
        )}
      </div>
    </CardContent>
  </Card>
);

const ComparisonRow = ({
  label, current, previous, currentLabel, previousLabel,
}: {
  label: string;
  current: number;
  previous: number;
  currentLabel: string;
  previousLabel: string;
}) => {
  const change = previous === 0 ? (current > 0 ? 100 : 0) : ((current - previous) / previous) * 100;
  const isUp = change >= 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-card-foreground">{label}</span>
        <span className={`text-sm font-medium flex items-center gap-1 ${
          isUp ? 'text-green-500' : 'text-destructive'
        }`}>
          {isUp ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
          {Math.abs(change).toFixed(1)}%
        </span>
      </div>
      <div className="flex gap-4">
        <div className="flex-1 rounded-lg bg-primary/10 p-3 text-center">
          <p className="text-xs text-muted-foreground">{currentLabel}</p>
          <p className="font-display text-lg text-primary">{fmt(current)}</p>
        </div>
        <div className="flex-1 rounded-lg bg-muted p-3 text-center">
          <p className="text-xs text-muted-foreground">{previousLabel}</p>
          <p className="font-display text-lg text-muted-foreground">{fmt(previous)}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
