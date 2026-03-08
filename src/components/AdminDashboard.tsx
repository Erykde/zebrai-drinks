import { useMemo, useState } from 'react';
import {
  DollarSign, TrendingUp, TrendingDown, BarChart3, Package,
  AlertTriangle, ShoppingCart, Users, ArrowUpRight, ArrowDownRight,
  Truck, Clock, Settings, Pencil, Check, X, Bike, Trash2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DbProduct } from '@/hooks/useProducts';
import DashboardConfigPanel, {
  DashboardConfig, loadDashboardConfig, getLabel, saveDashboardConfig,
} from '@/components/DashboardConfigPanel';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

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

interface CustomerOrderRow {
  id: string;
  delivery_fee: number;
  total: number;
  created_at: string;
  status: string;
}

interface AdminDashboardProps {
  orders: OrderRow[];
  products: DbProduct[];
  deliveryZones: any[];
  customerOrders: CustomerOrderRow[];
}

const LOW_STOCK_THRESHOLD = 10;

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

const formatDateLabel = (dateStr: string): string => {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (dateStr === today) return '📅 Hoje';
  if (dateStr === yesterday) return '📅 Ontem';
  const [y, m, d] = dateStr.split('-');
  return `📅 ${d}/${m}/${y}`;
};

const AdminDashboard = ({ orders, products, deliveryZones, customerOrders }: AdminDashboardProps) => {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<DashboardConfig>(loadDashboardConfig);
  const [showConfig, setShowConfig] = useState(false);
  const [editingOrder, setEditingOrder] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, any>>({});
  const [editingKpi, setEditingKpi] = useState<string | null>(null);
  const [kpiOverrides, setKpiOverrides] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('zebrai-kpi-overrides');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const saveKpiOverride = (key: string, value: number) => {
    const updated = { ...kpiOverrides, [key]: value };
    setKpiOverrides(updated);
    localStorage.setItem('zebrai-kpi-overrides', JSON.stringify(updated));
    setEditingKpi(null);
    toast.success('KPI atualizado!');
  };

  const clearKpiOverride = (key: string) => {
    const updated = { ...kpiOverrides };
    delete updated[key];
    setKpiOverrides(updated);
    localStorage.setItem('zebrai-kpi-overrides', JSON.stringify(updated));
    toast.success('Valor original restaurado!');
  };

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const monthStr = now.toISOString().slice(0, 7);

  const stats = useMemo(() => {
    const today = orders.filter(o => o.created_at.slice(0, 10) === todayStr);
    const thisMonth = orders.filter(o => o.created_at.slice(0, 7) === monthStr);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    const yesterdayOrders = orders.filter(o => o.created_at.slice(0, 10) === yesterdayStr);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
    const lastMonthOrders = orders.filter(o => o.created_at.slice(0, 7) === lastMonthStr);

    const calcStats = (arr: OrderRow[]) => {
      const revenue = arr.reduce((s, o) => s + o.total, 0);
      const cost = arr.reduce((s, o) => s + o.cost_price * o.quantity, 0);
      const profit = revenue - cost;
      const qty = arr.reduce((s, o) => s + o.quantity, 0);
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

  // Motoboy fee stats
  const motoboyStats = useMemo(() => {
    const todayFees = customerOrders
      .filter(o => o.created_at.slice(0, 10) === todayStr && o.status !== 'cancelled')
      .reduce((s, o) => s + Number(o.delivery_fee), 0);
    const monthFees = customerOrders
      .filter(o => o.created_at.slice(0, 7) === monthStr && o.status !== 'cancelled')
      .reduce((s, o) => s + Number(o.delivery_fee), 0);
    const totalDeliveries = customerOrders
      .filter(o => o.status !== 'cancelled' && Number(o.delivery_fee) > 0).length;
    const totalFees = customerOrders
      .filter(o => o.status !== 'cancelled')
      .reduce((s, o) => s + Number(o.delivery_fee), 0);
    return { todayFees, monthFees, totalDeliveries, totalFees };
  }, [customerOrders, todayStr, monthStr]);

  // Group orders by date
  const ordersByDate = useMemo(() => {
    const map = new Map<string, OrderRow[]>();
    orders.forEach(o => {
      const dateKey = o.created_at.slice(0, 10);
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(o);
    });
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [orders]);

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

  const isVisible = (id: string) => {
    const section = config.sections.find(s => s.id === id);
    return section ? section.visible : true;
  };

  const sortedSectionIds = [...config.sections]
    .sort((a, b) => a.order - b.order)
    .map(s => s.id);

  const startEditOrder = (o: OrderRow) => {
    setEditingOrder(o.id);
    setEditValues({ quantity: o.quantity, total: o.total, cost_price: o.cost_price });
  };

  const saveEditOrder = async (id: string) => {
    const { error } = await supabase.from('orders').update({
      quantity: editValues.quantity,
      total: editValues.total,
      cost_price: editValues.cost_price,
    }).eq('id', id);
    if (error) { toast.error('Erro ao salvar'); return; }
    toast.success('Venda atualizada!');
    setEditingOrder(null);
    queryClient.invalidateQueries({ queryKey: ['orders'] });
  };

  const deleteOrder = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta venda?')) return;
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir'); return; }
    toast.success('Venda excluída!');
    queryClient.invalidateQueries({ queryKey: ['orders'] });
  };

  const renderSection = (id: string) => {
    if (!isVisible(id)) return null;

    switch (id) {
      case 'kpis':
        return (
          <div key={id} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <EditableKpiCard kpiKey="kpi-sales-today" icon={<DollarSign className="h-5 w-5" />} label={getLabel(config, 'kpi-sales-today')} calculatedValue={stats.today.revenue} overrides={kpiOverrides} editingKpi={editingKpi} onStartEdit={setEditingKpi} onSave={saveKpiOverride} onClear={clearKpiOverride} sub={`Ontem: ${fmt(stats.yesterday.revenue)}`} change={pctChange(stats.today.revenue, stats.yesterday.revenue)} />
            <EditableKpiCard kpiKey="kpi-sales-month" icon={<DollarSign className="h-5 w-5" />} label={getLabel(config, 'kpi-sales-month')} calculatedValue={stats.thisMonth.revenue} overrides={kpiOverrides} editingKpi={editingKpi} onStartEdit={setEditingKpi} onSave={saveKpiOverride} onClear={clearKpiOverride} sub={`Mês passado: ${fmt(stats.lastMonth.revenue)}`} change={pctChange(stats.thisMonth.revenue, stats.lastMonth.revenue)} />
            <EditableKpiCard kpiKey="kpi-profit" icon={<TrendingUp className="h-5 w-5" />} label={getLabel(config, 'kpi-profit')} calculatedValue={stats.thisMonth.profit} overrides={kpiOverrides} editingKpi={editingKpi} onStartEdit={setEditingKpi} onSave={saveKpiOverride} onClear={clearKpiOverride} sub={`Custo: ${fmt(stats.thisMonth.cost)}`} color="text-green-500" />
            <EditableKpiCard kpiKey="kpi-ticket" icon={<ShoppingCart className="h-5 w-5" />} label={getLabel(config, 'kpi-ticket')} calculatedValue={stats.thisMonth.ticket} overrides={kpiOverrides} editingKpi={editingKpi} onStartEdit={setEditingKpi} onSave={saveKpiOverride} onClear={clearKpiOverride} sub={`${stats.thisMonth.uniqueOrders} pedidos`} />
          </div>
        );

      case 'motoboy':
        return (
          <Card key={id}>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Bike className="h-5 w-5 text-primary" /> {getLabel(config, 'motoboy-title')}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-lg border border-border bg-card p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Taxa Hoje</p>
                  <p className="text-2xl font-display text-primary">{fmt(motoboyStats.todayFees)}</p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Taxa no Mês</p>
                  <p className="text-2xl font-display text-primary">{fmt(motoboyStats.monthFees)}</p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Total Entregas</p>
                  <p className="text-2xl font-display text-card-foreground">{motoboyStats.totalDeliveries}</p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Total Arrecadado</p>
                  <p className="text-2xl font-display text-green-500">{fmt(motoboyStats.totalFees)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'profit':
        return (
          <div key={id} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <EditableKpiCard kpiKey="profit-today-val" icon={<TrendingUp className="h-5 w-5" />} label={getLabel(config, 'profit-today')} calculatedValue={stats.today.profit} overrides={kpiOverrides} editingKpi={editingKpi} onStartEdit={setEditingKpi} onSave={saveKpiOverride} onClear={clearKpiOverride} sub={`Fat: ${fmt(stats.today.revenue)} · Custo: ${fmt(stats.today.cost)}`} color="text-green-500" />
            <EditableKpiCard kpiKey="profit-month-val" icon={<TrendingUp className="h-5 w-5" />} label={getLabel(config, 'profit-month')} calculatedValue={stats.thisMonth.profit} overrides={kpiOverrides} editingKpi={editingKpi} onStartEdit={setEditingKpi} onSave={saveKpiOverride} onClear={clearKpiOverride} sub={`Fat: ${fmt(stats.thisMonth.revenue)} · Custo: ${fmt(stats.thisMonth.cost)}`} color="text-green-500" />
            <EditableKpiCard kpiKey="profit-margin-val" icon={<BarChart3 className="h-5 w-5" />} label={getLabel(config, 'profit-margin')} calculatedValue={stats.thisMonth.revenue > 0 ? Number(((stats.thisMonth.profit / stats.thisMonth.revenue) * 100).toFixed(1)) : 0} overrides={kpiOverrides} editingKpi={editingKpi} onStartEdit={setEditingKpi} onSave={saveKpiOverride} onClear={clearKpiOverride} sub={`Lucro total: ${fmt(stats.all.profit)}`} formatFn={(v) => `${v.toFixed(1)}%`} />
          </div>
        );

      case 'growth':
        return (
          <Card key={id}>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /> {getLabel(config, 'growth-title')}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ComparisonRow label="Hoje vs Ontem" current={stats.today.revenue} previous={stats.yesterday.revenue} currentLabel="Hoje" previousLabel="Ontem" />
                <ComparisonRow label="Este Mês vs Mês Passado" current={stats.thisMonth.revenue} previous={stats.lastMonth.revenue} currentLabel="Este mês" previousLabel="Mês passado" />
              </div>
            </CardContent>
          </Card>
        );

      case 'tracked-stock':
        return (
          <Card key={id}>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Package className="h-5 w-5 text-primary" /> {getLabel(config, 'tracked-stock-title')}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {trackedStock.map(item => (
                  <div key={item.label} className={`rounded-lg border p-3 text-center transition-colors ${item.stock <= LOW_STOCK_THRESHOLD ? 'border-destructive/50 bg-destructive/5' : 'border-border bg-card'}`}>
                    <p className="text-sm font-medium text-card-foreground">{item.label}</p>
                    <p className={`text-2xl font-display mt-1 ${item.stock <= LOW_STOCK_THRESHOLD ? 'text-destructive' : 'text-primary'}`}>{item.stock}</p>
                    <p className="text-xs text-muted-foreground">unidades</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case 'low-stock':
        if (lowStockProducts.length === 0) return null;
        return (
          <Card key={id} className="border-destructive/30">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2 text-destructive"><AlertTriangle className="h-5 w-5" /> {getLabel(config, 'low-stock-title')}</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {lowStockProducts.map(p => (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="text-sm text-card-foreground">{p.image_emoji} {p.name}<span className="text-muted-foreground ml-2 text-xs">({p.category})</span></span>
                    <span className={`font-display text-lg ${(p.stock ?? 0) === 0 ? 'text-destructive' : 'text-orange-500'}`}>{p.stock ?? 0} un</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case 'top-products':
        return (
          <Card key={id}>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> {getLabel(config, 'top-products-title')}</CardTitle></CardHeader>
            <CardContent>
              {topProducts.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">Nenhuma venda registrada.</p>
              ) : (
                <div className="space-y-2">
                  {topProducts.map((p, i) => {
                    const maxQty = topProducts[0]?.qty || 1;
                    return (
                      <div key={p.name} className="flex items-center gap-3">
                        <span className="text-xs font-medium text-muted-foreground w-5 text-right">{i + 1}º</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-1">
                            <span className="text-sm font-medium text-card-foreground truncate">{p.name}</span>
                            <span className="text-xs text-muted-foreground ml-2 whitespace-nowrap">{p.qty} un · {fmt(p.revenue)}</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(p.qty / maxQty) * 100}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 'delivery':
        return (
          <Card key={id}>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Truck className="h-5 w-5 text-primary" /> {getLabel(config, 'delivery-title')}</CardTitle></CardHeader>
            <CardContent>
              {deliveryZones.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">Nenhuma região cadastrada.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {deliveryZones.filter(z => z.is_active).map(z => (
                    <div key={z.id} className="rounded-lg border border-border bg-card p-3">
                      <p className="font-medium text-sm text-card-foreground">{z.zone_name}</p>
                      <p className="text-xs text-muted-foreground">{z.min_km}-{z.max_km} km</p>
                      <p className="text-lg font-display text-primary mt-1">{Number(z.fee) === 0 ? 'Grátis' : fmt(Number(z.fee))}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 'recent-sales':
        return (
          <Card key={id}>
            <CardHeader><CardTitle className="text-lg">{getLabel(config, 'recent-sales-title')}</CardTitle></CardHeader>
            <CardContent className="p-0">
              {orders.length === 0 ? (
                <p className="text-muted-foreground text-center py-8 px-6">Nenhuma venda registrada ainda.</p>
              ) : (
                <div className="overflow-x-auto">
                  {ordersByDate.map(([dateKey, dateOrders]) => {
                    const dayRevenue = dateOrders.reduce((s, o) => s + o.total, 0);
                    const dayCost = dateOrders.reduce((s, o) => s + o.cost_price * o.quantity, 0);
                    const dayProfit = dayRevenue - dayCost;
                    return (
                      <div key={dateKey}>
                        <div className="flex items-center justify-between px-4 py-3 bg-secondary/50 border-b border-border">
                          <span className="text-sm font-semibold text-card-foreground">{formatDateLabel(dateKey)}</span>
                          <div className="flex items-center gap-4 text-xs">
                            <span className="text-muted-foreground">{dateOrders.length} vendas</span>
                            <span className="text-primary font-medium">{fmt(dayRevenue)}</span>
                            <span className="text-green-500 font-medium">Lucro: {fmt(dayProfit)}</span>
                          </div>
                        </div>
                        <table className="w-full text-sm">
                          <thead className="bg-secondary text-secondary-foreground">
                            <tr>
                              <th className="text-left p-3">Produto</th>
                              <th className="text-center p-3">Qtd</th>
                              <th className="text-right p-3">Total</th>
                              <th className="text-right p-3">Lucro</th>
                              <th className="text-right p-3">Hora</th>
                              <th className="text-center p-3">Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dateOrders.map(o => (
                              <tr key={o.id} className="border-t border-border">
                                <td className="p-3 text-card-foreground">{o.product_name}{o.mixer ? ` + ${o.mixer}` : ''}</td>
                                <td className="p-3 text-center">
                                  {editingOrder === o.id ? (
                                    <Input type="number" value={editValues.quantity} onChange={e => setEditValues(v => ({ ...v, quantity: +e.target.value }))} className="h-7 w-16 text-center text-xs" />
                                  ) : <span className="text-muted-foreground">{o.quantity}</span>}
                                </td>
                                <td className="p-3 text-right">
                                  {editingOrder === o.id ? (
                                    <Input type="number" step="0.01" value={editValues.total} onChange={e => setEditValues(v => ({ ...v, total: +e.target.value }))} className="h-7 w-20 text-xs ml-auto" />
                                  ) : <span className="text-primary font-medium">{fmt(o.total)}</span>}
                                </td>
                                <td className="p-3 text-right text-green-500 font-medium">
                                  {editingOrder === o.id
                                    ? fmt(editValues.total - editValues.cost_price * editValues.quantity)
                                    : fmt(o.total - o.cost_price * o.quantity)}
                                </td>
                                <td className="p-3 text-right text-muted-foreground text-xs">
                                  {new Date(o.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className="p-3">
                                  {editingOrder === o.id ? (
                                    <div className="flex items-center justify-center gap-2">
                                      <Button size="sm" variant="default" className="h-7 px-2 text-xs" onClick={() => saveEditOrder(o.id)}>
                                        <Check className="h-3.5 w-3.5 mr-1" /> Salvar
                                      </Button>
                                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setEditingOrder(null)}>
                                        Cancelar
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-center gap-2">
                                      <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => startEditOrder(o)}>
                                        <Pencil className="h-3 w-3 mr-1" /> Editar
                                      </Button>
                                      <Button size="sm" variant="destructive" className="h-7 px-2 text-xs" onClick={() => deleteOrder(o.id)}>
                                        <Trash2 className="h-3 w-3 mr-1" /> Excluir
                                      </Button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 'custom':
        return null; // custom sections rendered separately

      default: {
        // Render custom sections
        const customSections: { id: string; title: string; content: string }[] = (() => {
          try {
            const saved = localStorage.getItem('zebrai-custom-sections');
            return saved ? JSON.parse(saved) : [];
          } catch { return []; }
        })();
        const custom = customSections.find(s => s.id === id);
        if (!custom) return null;
        return (
          <Card key={id}>
            <CardHeader><CardTitle className="text-lg">{custom.title}</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-card-foreground whitespace-pre-wrap">{custom.content}</p>
            </CardContent>
          </Card>
        );
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => setShowConfig(!showConfig)}>
          <Settings className="h-4 w-4 mr-1" /> Personalizar
        </Button>
      </div>

      {showConfig && (
        <DashboardConfigPanel config={config} onChange={setConfig} onClose={() => setShowConfig(false)} />
      )}

      {sortedSectionIds.map(id => renderSection(id))}
    </div>
  );
};

// === Sub-components ===

const EditableKpiCard = ({ kpiKey, icon, label, calculatedValue, overrides, editingKpi, onStartEdit, onSave, onClear, sub, change, color }: {
  kpiKey: string; icon: React.ReactNode; label: string; calculatedValue: number;
  overrides: Record<string, number>; editingKpi: string | null;
  onStartEdit: (key: string | null) => void; onSave: (key: string, value: number) => void; onClear: (key: string) => void;
  sub?: string; change?: number; color?: string;
}) => {
  const [tempVal, setTempVal] = useState('');
  const hasOverride = kpiKey in overrides;
  const displayValue = hasOverride ? overrides[kpiKey] : calculatedValue;
  const isEditing = editingKpi === kpiKey;

  return (
    <Card className="relative group">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">{icon}<span className="text-xs font-medium">{label}</span></div>
        {isEditing ? (
          <div className="flex items-center gap-1 mt-1">
            <Input type="number" step="0.01" autoFocus value={tempVal} onChange={e => setTempVal(e.target.value)} className="h-8 w-28 text-sm" placeholder="Novo valor" />
            <button onClick={() => { onSave(kpiKey, Number(tempVal)); }} className="p-1 text-green-500 hover:bg-green-500/10 rounded"><Check className="h-4 w-4" /></button>
            <button onClick={() => onStartEdit(null)} className="p-1 text-muted-foreground hover:bg-muted rounded"><X className="h-4 w-4" /></button>
          </div>
        ) : (
          <>
            <p className={`font-display text-2xl ${color || 'text-card-foreground'}`}>{fmt(displayValue)}</p>
            {hasOverride && <span className="text-[10px] text-muted-foreground">(editado manualmente)</span>}
          </>
        )}
        <div className="flex items-center gap-2 mt-1">
          {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
          {change !== undefined && change !== 0 && (
            <span className={`text-xs font-medium flex items-center gap-0.5 ${change > 0 ? 'text-green-500' : 'text-destructive'}`}>
              {change > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(change).toFixed(0)}%
            </span>
          )}
        </div>
        {!isEditing && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <button onClick={() => { setTempVal(String(displayValue)); onStartEdit(kpiKey); }} className="p-1 text-primary hover:bg-primary/10 rounded" title="Editar valor">
              <Pencil className="h-3 w-3" />
            </button>
            {hasOverride && (
              <button onClick={() => onClear(kpiKey)} className="p-1 text-muted-foreground hover:bg-muted rounded" title="Restaurar valor original">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const KpiCard = ({ icon, label, value, sub, change, color }: {
  icon: React.ReactNode; label: string; value: string; sub?: string; change?: number; color?: string;
}) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">{icon}<span className="text-xs font-medium">{label}</span></div>
      <p className={`font-display text-2xl ${color || 'text-card-foreground'}`}>{value}</p>
      <div className="flex items-center gap-2 mt-1">
        {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
        {change !== undefined && change !== 0 && (
          <span className={`text-xs font-medium flex items-center gap-0.5 ${change > 0 ? 'text-green-500' : 'text-destructive'}`}>
            {change > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(change).toFixed(0)}%
          </span>
        )}
      </div>
    </CardContent>
  </Card>
);

const ComparisonRow = ({ label, current, previous, currentLabel, previousLabel }: {
  label: string; current: number; previous: number; currentLabel: string; previousLabel: string;
}) => {
  const change = previous === 0 ? (current > 0 ? 100 : 0) : ((current - previous) / previous) * 100;
  const isUp = change >= 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-card-foreground">{label}</span>
        <span className={`text-sm font-medium flex items-center gap-1 ${isUp ? 'text-green-500' : 'text-destructive'}`}>
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
