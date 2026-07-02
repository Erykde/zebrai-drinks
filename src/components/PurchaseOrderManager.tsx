import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ShoppingCart, TrendingUp, TrendingDown, Minus, Save, Search, ArrowRight, Package } from 'lucide-react';
import { DbProduct } from '@/hooks/useProducts';

interface ProductIngredient {
  id: string;
  product_id: string;
  name: string;
  cost: number;
  quantity: number;
  unit: string;
  stock: number | null;
}

interface PurchaseOrderManagerProps {
  products: DbProduct[];
}

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const PurchaseOrderManager = ({ products }: PurchaseOrderManagerProps) => {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'up' | 'down' | 'changed'>('all');
  const [saving, setSaving] = useState(false);
  const [newPrices, setNewPrices] = useState<Record<string, number>>({});

  const { data: ingredients = [], isLoading } = useQuery({
    queryKey: ['product-ingredients'],
    queryFn: async (): Promise<ProductIngredient[]> => {
      const { data, error } = await supabase
        .from('product_ingredients')
        .select('id, product_id, name, cost, quantity, unit, stock')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as ProductIngredient[];
    },
  });

  // Group ingredients by product
  const grouped = useMemo(() => {
    const map: Record<string, ProductIngredient[]> = {};
    for (const ing of ingredients) {
      if (!map[ing.product_id]) map[ing.product_id] = [];
      map[ing.product_id].push(ing);
    }
    return map;
  }, [ingredients]);

  const productsWithIngredients = useMemo(() => {
    return products.filter(p => (grouped[p.id] || []).length > 0);
  }, [products, grouped]);

  const handlePriceChange = (ingredientId: string, value: string) => {
    const num = value === '' ? 0 : parseFloat(value);
    setNewPrices(prev => ({ ...prev, [ingredientId]: num }));
  };

  const getDiff = (ingredient: ProductIngredient) => {
    const newPrice = newPrices[ingredient.id];
    if (newPrice === undefined || newPrice === 0) return { type: 'none', value: 0, percent: 0 };
    const diff = newPrice - ingredient.cost;
    const percent = ingredient.cost > 0 ? (diff / ingredient.cost) * 100 : 0;
    if (diff > 0) return { type: 'up', value: diff, percent };
    if (diff < 0) return { type: 'down', value: diff, percent };
    return { type: 'same', value: 0, percent: 0 };
  };

  const productStats = (productId: string) => {
    const ings = grouped[productId] || [];
    const currentCost = ings.reduce((s, i) => s + i.cost * i.quantity, 0);
    const newCost = ings.reduce((s, i) => {
      const price = newPrices[i.id] || i.cost;
      return s + price * i.quantity;
    }, 0);
    return { currentCost, newCost, diff: newCost - currentCost };
  };

  const filteredProducts = useMemo(() => {
    let list = productsWithIngredients;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || (grouped[p.id] || []).some(i => i.name.toLowerCase().includes(q)));
    }
    if (filter === 'all') return list;
    return list.filter(p => {
      const ings = grouped[p.id] || [];
      return ings.some(i => {
        const diff = getDiff(i);
        if (filter === 'up') return diff.type === 'up';
        if (filter === 'down') return diff.type === 'down';
        return diff.type !== 'none';
      });
    });
  }, [productsWithIngredients, search, filter, grouped, newPrices]);

  const hasChanges = Object.keys(newPrices).length > 0 && Object.values(newPrices).some(v => v > 0);

  const applyChanges = async () => {
    const updates = Object.entries(newPrices).filter(([_, price]) => price > 0);
    if (updates.length === 0) {
      toast.error('Nenhum preço novo para aplicar');
      return;
    }
    setSaving(true);

    // Group by product to update cost_price
    const productIds = new Set<string>();
    for (const [id, price] of updates) {
      const ing = ingredients.find(i => i.id === id);
      if (ing) productIds.add(ing.product_id);
    }

    // Update each ingredient cost
    for (const [id, price] of updates) {
      const { error } = await supabase.from('product_ingredients').update({ cost: price }).eq('id', id);
      if (error) {
        toast.error('Erro ao atualizar preço: ' + error.message);
        setSaving(false);
        return;
      }
    }

    // Update product cost_price
    for (const pid of productIds) {
      const ings = grouped[pid] || [];
      const newCost = ings.reduce((s, i) => s + (newPrices[i.id] || i.cost) * i.quantity, 0);
      const { error } = await supabase.from('products').update({ cost_price: newCost }).eq('id', pid);
      if (error) {
        toast.error('Erro ao atualizar custo do produto');
        setSaving(false);
        return;
      }
    }

    toast.success('Preços de compra atualizados!');
    setNewPrices({});
    qc.invalidateQueries({ queryKey: ['product-ingredients'] });
    qc.invalidateQueries({ queryKey: ['products'] });
    setSaving(false);
  };

  const totalCurrentCost = productsWithIngredients.reduce((s, p) => s + productStats(p.id).currentCost, 0);
  const totalNewCost = productsWithIngredients.reduce((s, p) => s + productStats(p.id).newCost, 0);
  const totalDiff = totalNewCost - totalCurrentCost;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-7 w-7 text-primary" />
          <div>
            <h2 className="font-display text-3xl text-foreground tracking-wider">ORDEM DE COMPRA</h2>
            <p className="text-sm text-muted-foreground">Compare os preços atuais com os novos do fornecedor</p>
          </div>
        </div>
        <p className="text-center text-muted-foreground py-12">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      <div className="flex items-center gap-3">
        <ShoppingCart className="h-7 w-7 text-primary" />
        <div>
          <h2 className="font-display text-3xl text-foreground tracking-wider">ORDEM DE COMPRA</h2>
          <p className="text-sm text-muted-foreground">Digite o novo preço do fornecedor para cada item. Vermelho = ficou mais caro, Verde = ficou mais barato, Cinza = igual.</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Produtos com custo</p>
          <p className="text-2xl font-bold text-foreground">{productsWithIngredients.length}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Custo atual total</p>
          <p className="text-2xl font-bold text-foreground">{fmt(totalCurrentCost)}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Novo custo total</p>
          <p className={`text-2xl font-bold ${totalDiff > 0 ? 'text-destructive' : totalDiff < 0 ? 'text-green-500' : 'text-foreground'}`}>
            {fmt(totalNewCost)}
          </p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Diferença</p>
          <p className={`text-2xl font-bold ${totalDiff > 0 ? 'text-destructive' : totalDiff < 0 ? 'text-green-500' : 'text-foreground'}`}>
            {totalDiff > 0 ? '+' : ''}{fmt(totalDiff)}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar produto ou ingrediente..."
            className="w-full pl-9 pr-4 py-3 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {[
            { key: 'all', label: 'Todos' },
            { key: 'up', label: 'Subiu' },
            { key: 'down', label: 'Desceu' },
            { key: 'changed', label: 'Alterados' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border ${
                filter === key ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={applyChanges}
          disabled={!hasChanges || saving}
          className="bg-gradient-gold text-primary-foreground px-4 py-2 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 justify-center"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Salvando...' : 'Aplicar preços'}
        </button>
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12 text-muted-foreground bg-card rounded-2xl border border-border">
          <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>Nenhum produto com ingredientes encontrado.</p>
          <p className="text-xs mt-1">Cadastre ingredientes na aba "Precificação" primeiro.</p>
        </div>
      )}

      {/* Products list */}
      <div className="space-y-4">
        {filteredProducts.map(product => {
          const ings = grouped[product.id] || [];
          const stats = productStats(product.id);
          const hasProductChange = stats.diff !== 0;
          const margin100 = stats.newCost > 0 ? stats.newCost * 2 : product.price;
          const margin50 = stats.newCost > 0 ? stats.newCost * 1.5 : product.price;
          const margin30 = stats.newCost > 0 ? stats.newCost * 1.3 : product.price;

          return (
            <div key={product.id} className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="p-4 border-b border-border flex flex-col md:flex-row md:items-center gap-3 justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{product.image_emoji || '🍹'}</span>
                  <div>
                    <p className="font-display text-lg text-foreground">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.category} · {ings.length} ingrediente{ings.length > 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Preço de venda: <span className="font-bold text-foreground">{fmt(product.price)}</span></p>
                  <div className="flex items-center gap-3 justify-end text-sm mt-1">
                    <span className="text-muted-foreground">Custo: {fmt(stats.currentCost)}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span className={`font-bold ${hasProductChange ? (stats.diff > 0 ? 'text-destructive' : 'text-green-500') : 'text-foreground'}`}>
                      {fmt(stats.newCost)}
                    </span>
                    {hasProductChange && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${stats.diff > 0 ? 'bg-destructive/10 text-destructive' : 'bg-green-500/10 text-green-500'}`}>
                        {stats.diff > 0 ? '+' : ''}{fmt(stats.diff)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4">
                <div className="space-y-2">
                  {ings.map(ingredient => {
                    const diff = getDiff(ingredient);
                    const newPrice = newPrices[ingredient.id] ?? 0;
                    const colorClass = diff.type === 'up' ? 'text-destructive' : diff.type === 'down' ? 'text-green-500' : 'text-foreground';
                    const inputBorder = diff.type === 'up' ? 'border-destructive focus:ring-destructive' : diff.type === 'down' ? 'border-green-500 focus:ring-green-500' : 'border-input focus:ring-ring';

                    return (
                      <div key={ingredient.id} className="grid grid-cols-12 gap-2 items-center py-2 border-b border-border last:border-0">
                        <div className="col-span-4 md:col-span-3">
                          <p className="text-sm font-medium text-foreground">{ingredient.name}</p>
                          <p className="text-[10px] text-muted-foreground">{ingredient.quantity} {ingredient.unit}</p>
                        </div>
                        <div className="col-span-3 md:col-span-2 text-right">
                          <p className="text-xs text-muted-foreground">Atual</p>
                          <p className="text-sm font-semibold text-foreground">{fmt(ingredient.cost)}</p>
                        </div>
                        <div className="col-span-5 md:col-span-4">
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                            <input
                              type="number"
                              value={newPrice || ''}
                              onChange={e => handlePriceChange(ingredient.id, e.target.value)}
                              placeholder={ingredient.cost.toFixed(2)}
                              step="0.01"
                              min="0"
                              className={`w-full pl-6 pr-2 py-2 rounded-lg border ${inputBorder} bg-background text-sm outline-none focus:ring-2 ${colorClass}`}
                            />
                          </div>
                        </div>
                        <div className="col-span-12 md:col-span-3 flex items-center gap-2 md:justify-end">
                          {diff.type === 'up' && (
                            <>
                              <TrendingUp className="h-4 w-4 text-destructive" />
                              <span className="text-sm font-bold text-destructive">+{fmt(diff.value)} ({diff.percent.toFixed(0)}%)</span>
                            </>
                          )}
                          {diff.type === 'down' && (
                            <>
                              <TrendingDown className="h-4 w-4 text-green-500" />
                              <span className="text-sm font-bold text-green-500">{fmt(diff.value)} ({diff.percent.toFixed(0)}%)</span>
                            </>
                          )}
                          {diff.type === 'same' && (
                            <>
                              <Minus className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">Igual</span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Suggested prices based on new cost */}
                {stats.newCost > 0 && (
                  <div className="mt-4 pt-3 border-t border-border">
                    <p className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">💡 Sugestão de venda com novo custo</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div className={`rounded-lg border p-2 text-center ${product.price < margin30 ? 'bg-destructive/5 border-destructive/30' : 'bg-muted/50 border-border'}`}>
                        <p className="text-[10px] text-muted-foreground">Mínimo 30%</p>
                        <p className="text-sm font-bold text-orange-500">{fmt(margin30)}</p>
                      </div>
                      <div className={`rounded-lg border p-2 text-center ${product.price < margin50 ? 'bg-destructive/5 border-destructive/30' : 'bg-muted/50 border-border'}`}>
                        <p className="text-[10px] text-muted-foreground">Bom 50%</p>
                        <p className="text-sm font-bold text-yellow-500">{fmt(margin50)}</p>
                      </div>
                      <div className={`rounded-lg border p-2 text-center ${product.price < margin100 ? 'bg-destructive/5 border-destructive/30' : 'bg-muted/50 border-border'}`}>
                        <p className="text-[10px] text-muted-foreground">Ideal 100%</p>
                        <p className="text-sm font-bold text-green-500">{fmt(margin100)}</p>
                      </div>
                    </div>
                    {stats.newCost > product.price && (
                      <p className="text-xs text-destructive mt-2 font-bold animate-pulse">⚠️ Novo custo supera o preço de venda atual!</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PurchaseOrderManager;
