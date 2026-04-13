import { useState } from 'react';
import { useProducts, DbProduct } from '@/hooks/useProducts';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Package, Minus, Plus, Save, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const StockManager = () => {
  const { data: products = [], isLoading } = useProducts();
  const queryClient = useQueryClient();
  const [editedStocks, setEditedStocks] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  const getStock = (p: DbProduct) => editedStocks[p.id] ?? p.stock ?? 0;
  const hasChanges = Object.keys(editedStocks).length > 0;

  const updateStock = (id: string, value: number) => {
    const clamped = Math.max(0, Math.min(9999, value));
    setEditedStocks(prev => ({ ...prev, [id]: clamped }));
  };

  const increment = (p: DbProduct) => updateStock(p.id, getStock(p) + 1);
  const decrement = (p: DbProduct) => updateStock(p.id, getStock(p) - 1);

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(editedStocks).map(([id, stock]) =>
        supabase.from('products').update({ stock } as any).eq('id', id)
      );
      await Promise.all(updates);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setEditedStocks({});
      toast.success('Estoque atualizado!');
    } catch {
      toast.error('Erro ao salvar estoque');
    } finally {
      setSaving(false);
    }
  };

  const lowStock = products.filter(p => (p.stock ?? 0) <= 5);
  const outOfStock = products.filter(p => (p.stock ?? 0) === 0);

  if (isLoading) return <p className="text-muted-foreground">Carregando...</p>;

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold text-foreground">{products.length}</p>
            <p className="text-xs text-muted-foreground">Produtos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-5 w-5 mx-auto text-yellow-500 mb-1" />
            <p className="text-2xl font-bold text-foreground">{lowStock.length}</p>
            <p className="text-xs text-muted-foreground">Estoque baixo</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-5 w-5 mx-auto text-destructive mb-1" />
            <p className="text-2xl font-bold text-foreground">{outOfStock.length}</p>
            <p className="text-xs text-muted-foreground">Sem estoque</p>
          </CardContent>
        </Card>
      </div>

      {/* Botão salvar */}
      {hasChanges && (
        <Button onClick={handleSaveAll} className="w-full" disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      )}

      {/* Lista de produtos */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            📦 Editar Estoque
          </CardTitle>
          <p className="text-xs text-muted-foreground">Use os botões + e - ou digite a quantidade direto</p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {products.map(p => {
              const stock = getStock(p);
              const isEdited = editedStocks[p.id] !== undefined;
              const isLow = stock <= 5 && stock > 0;
              const isOut = stock === 0;

              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-3 px-4 py-3 ${isOut ? 'bg-destructive/5' : isLow ? 'bg-yellow-500/5' : ''}`}
                >
                  {/* Product info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.category}</p>
                  </div>

                  {/* Status icon */}
                  {isOut ? (
                    <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                  ) : isLow ? (
                    <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                  )}

                  {/* Stock controls */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => decrement(p)}
                      className="w-8 h-8 rounded-lg bg-muted hover:bg-destructive/20 flex items-center justify-center transition-colors"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <Input
                      type="number"
                      value={stock}
                      onChange={e => updateStock(p.id, parseInt(e.target.value) || 0)}
                      className={`w-16 text-center text-sm h-8 ${isEdited ? 'border-primary ring-1 ring-primary' : ''}`}
                      min={0}
                      max={9999}
                    />
                    <button
                      onClick={() => increment(p)}
                      className="w-8 h-8 rounded-lg bg-muted hover:bg-green-500/20 flex items-center justify-center transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StockManager;
