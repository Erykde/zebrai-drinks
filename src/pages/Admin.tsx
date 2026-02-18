import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProducts, DbProduct } from '@/hooks/useProducts';
import Header from '@/components/Header';
import { Pencil, Trash2, Plus, Package, LogOut, DollarSign, TrendingUp, BarChart3, X } from 'lucide-react';
import { toast } from 'sonner';
import ImageUpload from '@/components/ImageUpload';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient, useQuery } from '@tanstack/react-query';

interface MixerOption {
  mixer: string;
  price: number;
}

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

const Admin = () => {
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const queryClient = useQueryClient();
  const { user, isAdmin, loading, signOut } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DbProduct | null>(null);
  const [activeTab, setActiveTab] = useState<'products' | 'dashboard'>('products');

  // Form state
  const [form, setForm] = useState({
    name: '', description: '', price: '', category: '', image: '🍹', stock: '', imageUrl: '', costPrice: '',
  });
  const [mixerOptions, setMixerOptions] = useState<MixerOption[]>([]);
  const [saving, setSaving] = useState(false);

  // Orders for dashboard
  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: async (): Promise<OrderRow[]> => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const resetForm = () => {
    setForm({ name: '', description: '', price: '', category: '', image: '🍹', stock: '', imageUrl: '', costPrice: '' });
    setMixerOptions([]);
    setEditingProduct(null);
    setShowForm(false);
  };

  const handleEdit = (product: DbProduct) => {
    setForm({
      name: product.name,
      description: product.description ?? '',
      price: product.price.toString(),
      category: product.category,
      image: product.image_emoji ?? '🍹',
      stock: (product.stock ?? 99).toString(),
      imageUrl: product.image_url ?? '',
      costPrice: ((product as any).cost_price ?? 0).toString(),
    });
    setMixerOptions(product.mixer_options.length > 0 ? [...product.mixer_options] : []);
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      toast.error('Erro ao remover produto');
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['products'] });
    toast.success('Produto removido!');
  };

  const addMixer = () => {
    setMixerOptions(prev => [...prev, { mixer: '', price: 0 }]);
  };

  const removeMixer = (index: number) => {
    setMixerOptions(prev => prev.filter((_, i) => i !== index));
  };

  const updateMixer = (index: number, field: keyof MixerOption, value: string | number) => {
    setMixerOptions(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const validMixers = mixerOptions.filter(m => m.mixer.trim() !== '');
    const productData = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: parseFloat(form.price),
      category: form.category,
      image_emoji: form.image,
      stock: parseInt(form.stock),
      image_url: form.imageUrl || null,
      cost_price: parseFloat(form.costPrice) || 0,
      mixer_options: validMixers.length > 0 ? JSON.parse(JSON.stringify(validMixers)) : [],
    };

    if (editingProduct) {
      const { error } = await supabase.from('products').update(productData as any).eq('id', editingProduct.id);
      if (error) {
        toast.error('Erro ao atualizar produto');
        setSaving(false);
        return;
      }
      toast.success('Produto atualizado!');
    } else {
      const { error } = await supabase.from('products').insert(productData as any);
      if (error) {
        toast.error('Erro ao adicionar produto');
        setSaving(false);
        return;
      }
      toast.success('Produto adicionado!');
    }
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['categories'] });
    setSaving(false);
    resetForm();
  };

  const totalStock = products.reduce((sum, p) => sum + (p.stock ?? 0), 0);

  // Dashboard calculations
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const totalCost = orders.reduce((sum, o) => sum + (o.cost_price * o.quantity), 0);
  const totalProfit = totalRevenue - totalCost;
  const totalSold = orders.reduce((sum, o) => sum + o.quantity, 0);

  if (loading || productsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-3xl text-foreground">PAINEL ADM 🦓</h1>
          <button onClick={signOut} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors">
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${activeTab === 'products' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
          >
            <Package className="h-4 w-4 inline mr-1" /> Produtos
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${activeTab === 'dashboard' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
          >
            <BarChart3 className="h-4 w-4 inline mr-1" /> Dashboard
          </button>
        </div>

        {activeTab === 'dashboard' ? (
          <DashboardTab
            orders={orders}
            totalRevenue={totalRevenue}
            totalCost={totalCost}
            totalProfit={totalProfit}
            totalSold={totalSold}
            totalStock={totalStock}
            productsCount={products.length}
          />
        ) : (
          <ProductsTab
            products={products}
            showForm={showForm}
            editingProduct={editingProduct}
            form={form}
            setForm={setForm}
            mixerOptions={mixerOptions}
            saving={saving}
            onResetForm={resetForm}
            onShowForm={() => { resetForm(); setShowForm(true); }}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onSubmit={handleSubmit}
            onAddMixer={addMixer}
            onRemoveMixer={removeMixer}
            onUpdateMixer={updateMixer}
          />
        )}
      </div>
    </div>
  );
};

// === Dashboard Tab ===
const DashboardTab = ({
  orders, totalRevenue, totalCost, totalProfit, totalSold, totalStock, productsCount,
}: {
  orders: OrderRow[];
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  totalSold: number;
  totalStock: number;
  productsCount: number;
}) => (
  <div>
    {/* Stats Grid */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <StatCard icon={<DollarSign className="h-5 w-5" />} label="Faturamento" value={`R$ ${totalRevenue.toFixed(2)}`} color="text-primary" />
      <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Lucro Líquido" value={`R$ ${totalProfit.toFixed(2)}`} color="text-green-500" />
      <StatCard icon={<BarChart3 className="h-5 w-5" />} label="Vendas" value={totalSold.toString()} />
      <StatCard icon={<Package className="h-5 w-5" />} label="Estoque Total" value={`${totalStock} un`} />
    </div>

    {/* Recent Orders */}
    <h2 className="font-display text-xl text-foreground mb-4">Últimas Vendas</h2>
    {orders.length === 0 ? (
      <p className="text-muted-foreground text-center py-8">Nenhuma venda registrada ainda.</p>
    ) : (
      <div className="bg-card rounded-lg border border-border overflow-hidden">
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
                  <td className="p-3 text-right text-primary font-medium">R$ {o.total.toFixed(2)}</td>
                  <td className="p-3 text-right text-green-500 font-medium">
                    R$ {(o.total - (o.cost_price * o.quantity)).toFixed(2)}
                  </td>
                  <td className="p-3 text-right text-muted-foreground text-xs">
                    {new Date(o.created_at).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </div>
);

// === Products Tab ===
const ProductsTab = ({
  products, showForm, editingProduct, form, setForm, mixerOptions, saving,
  onResetForm, onShowForm, onEdit, onDelete, onSubmit, onAddMixer, onRemoveMixer, onUpdateMixer,
}: {
  products: DbProduct[];
  showForm: boolean;
  editingProduct: DbProduct | null;
  form: any;
  setForm: (f: any) => void;
  mixerOptions: MixerOption[];
  saving: boolean;
  onResetForm: () => void;
  onShowForm: () => void;
  onEdit: (p: DbProduct) => void;
  onDelete: (id: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onAddMixer: () => void;
  onRemoveMixer: (i: number) => void;
  onUpdateMixer: (i: number, f: keyof MixerOption, v: string | number) => void;
}) => (
  <div>
    <button
      onClick={onShowForm}
      className="mb-4 flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-colors"
    >
      <Plus className="h-4 w-4" /> Novo Produto
    </button>

    {showForm && (
      <form onSubmit={onSubmit} className="bg-card rounded-lg border border-border p-6 mb-6 animate-fade-in">
        <h3 className="font-display text-xl mb-4 text-card-foreground">
          {editingProduct ? 'EDITAR PRODUTO' : 'NOVO PRODUTO'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Nome" required maxLength={100}
            className="px-4 py-2 rounded-lg border border-input bg-background text-foreground" />
          <input value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder="Categoria" required maxLength={50}
            className="px-4 py-2 rounded-lg border border-input bg-background text-foreground" />
          <input value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Descrição" maxLength={200}
            className="px-4 py-2 rounded-lg border border-input bg-background text-foreground md:col-span-2" />
          <input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="Preço de venda (R$)" required step="0.01" min="0"
            className="px-4 py-2 rounded-lg border border-input bg-background text-foreground" />
          <input type="number" value={form.costPrice} onChange={e => setForm({...form, costPrice: e.target.value})} placeholder="Preço de custo (R$)" step="0.01" min="0"
            className="px-4 py-2 rounded-lg border border-input bg-background text-foreground" />
          <input type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} placeholder="Estoque" required min="0"
            className="px-4 py-2 rounded-lg border border-input bg-background text-foreground" />
          <input value={form.image} onChange={e => setForm({...form, image: e.target.value})} placeholder="Emoji do produto" maxLength={4}
            className="px-4 py-2 rounded-lg border border-input bg-background text-foreground" />
          <div className="md:col-span-2">
            <ImageUpload
              currentUrl={form.imageUrl || undefined}
              onUpload={(url) => setForm({...form, imageUrl: url})}
              onRemove={() => setForm({...form, imageUrl: ''})}
            />
          </div>
        </div>

        {/* Mixer Options */}
        <div className="mt-6 border-t border-border pt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-medium text-card-foreground">Acompanhamentos (Mixer)</p>
            <button type="button" onClick={onAddMixer} className="text-sm text-primary flex items-center gap-1 hover:underline">
              <Plus className="h-3 w-3" /> Adicionar
            </button>
          </div>
          {mixerOptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum acompanhamento cadastrado.</p>
          ) : (
            <div className="space-y-2">
              {mixerOptions.map((m, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    value={m.mixer}
                    onChange={e => onUpdateMixer(i, 'mixer', e.target.value)}
                    placeholder="Ex: Red Bull, Gelo Saborizado"
                    className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm"
                  />
                  <input
                    type="number"
                    value={m.price}
                    onChange={e => onUpdateMixer(i, 'price', parseFloat(e.target.value) || 0)}
                    placeholder="Preço"
                    step="0.01"
                    min="0"
                    className="w-28 px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm"
                  />
                  <button type="button" onClick={() => onRemoveMixer(i)} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-4">
          <button type="submit" disabled={saving} className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:opacity-90 transition-colors disabled:opacity-50">
            {saving ? 'Salvando...' : editingProduct ? 'Salvar' : 'Adicionar'}
          </button>
          <button type="button" onClick={onResetForm} className="px-6 py-2 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors">
            Cancelar
          </button>
        </div>
      </form>
    )}

    {/* Products table */}
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-secondary-foreground">
            <tr>
              <th className="text-left p-3">Produto</th>
              <th className="text-left p-3">Categoria</th>
              <th className="text-right p-3">Preço</th>
              <th className="text-right p-3">Custo</th>
              <th className="text-right p-3">Estoque</th>
              <th className="text-center p-3">Mixers</th>
              <th className="text-right p-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} className="border-t border-border hover:bg-muted/50">
                <td className="p-3 font-medium text-card-foreground">
                  {p.image_url ? (
                    <span className="inline-flex items-center gap-2">
                      <img src={p.image_url} alt="" className="w-8 h-8 rounded object-cover" />
                      {p.name}
                    </span>
                  ) : (
                    <span>{p.image_emoji} {p.name}</span>
                  )}
                </td>
                <td className="p-3 text-muted-foreground">{p.category}</td>
                <td className="p-3 text-right text-primary font-medium">R$ {p.price.toFixed(2)}</td>
                <td className="p-3 text-right text-muted-foreground">R$ {((p as any).cost_price ?? 0).toFixed(2)}</td>
                <td className={`p-3 text-right font-medium ${(p.stock ?? 0) <= 5 ? 'text-destructive' : 'text-card-foreground'}`}>{p.stock ?? 0}</td>
                <td className="p-3 text-center text-muted-foreground">{p.mixer_options.length}</td>
                <td className="p-3 text-right">
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => onEdit(p)} className="p-1.5 rounded-md hover:bg-primary/10 text-primary transition-colors">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => onDelete(p.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const StatCard = ({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color?: string }) => (
  <div className="bg-card rounded-lg border border-border p-4">
    <div className="flex items-center gap-2 text-muted-foreground mb-1">
      {icon}
      <span className="text-sm">{label}</span>
    </div>
    <p className={`font-display text-2xl ${color || 'text-card-foreground'}`}>{value}</p>
  </div>
);

export default Admin;
