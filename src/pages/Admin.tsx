import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { Product } from '@/data/products';
import { Pencil, Trash2, Plus, Package, TrendingUp, DollarSign, BarChart3, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import ImageUpload from '@/components/ImageUpload';

const Admin = () => {
  const { products, setProducts, orders } = useStore();
  const { user, isAdmin, loading, signOut } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'finance'>('products');

  // Form state
  const [form, setForm] = useState({
    name: '', description: '', price: '', costPrice: '', category: '', image: '🍹', stock: '', imageUrl: '',
  });

  const resetForm = () => {
    setForm({ name: '', description: '', price: '', costPrice: '', category: '', image: '🍹', stock: '', imageUrl: '' });
    setEditingProduct(null);
    setShowForm(false);
  };

  const handleEdit = (product: Product) => {
    setForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      costPrice: product.costPrice.toString(),
      category: product.category,
      image: product.image,
      stock: product.stock.toString(),
      imageUrl: (product as any).imageUrl || '',
    });
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    toast.success('Produto removido!');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const productData = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: parseFloat(form.price),
      costPrice: parseFloat(form.costPrice),
      category: form.category,
      image: form.image,
      stock: parseInt(form.stock),
    };

    if (editingProduct) {
      setProducts(prev =>
        prev.map(p => p.id === editingProduct.id ? { ...p, ...productData } : p)
      );
      toast.success('Produto atualizado!');
    } else {
      const newProduct: Product = {
        ...productData,
        id: Date.now().toString(),
        sold: 0,
      };
      setProducts(prev => [...prev, newProduct]);
      toast.success('Produto adicionado!');
    }
    resetForm();
  };

  // Finance calculations
  const totalRevenue = products.reduce((sum, p) => sum + p.price * p.sold, 0);
  const totalCost = products.reduce((sum, p) => sum + p.costPrice * p.sold, 0);
  const totalProfit = totalRevenue - totalCost;
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);

  const tabs = [
    { key: 'products' as const, label: 'Produtos', icon: Package },
    { key: 'orders' as const, label: 'Pedidos', icon: BarChart3 },
    { key: 'finance' as const, label: 'Financeiro', icon: DollarSign },
  ];

  if (loading) {
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
          <h1 className="font-display text-4xl text-foreground">PAINEL ADM 🦓</h1>
          <button onClick={signOut} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors">
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<Package className="h-5 w-5" />} label="Produtos" value={products.length.toString()} />
          <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Vendas" value={products.reduce((s, p) => s + p.sold, 0).toString()} />
          <StatCard icon={<DollarSign className="h-5 w-5" />} label="Receita" value={`R$ ${totalRevenue.toFixed(0)}`} />
          <StatCard icon={<BarChart3 className="h-5 w-5" />} label="Lucro" value={`R$ ${totalProfit.toFixed(0)}`} color="text-green-600" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-primary text-primary-foreground shadow-gold'
                  : 'bg-muted text-muted-foreground hover:bg-primary/20'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div>
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="mb-4 flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-gold-dark transition-colors shadow-gold"
            >
              <Plus className="h-4 w-4" /> Novo Produto
            </button>

            {showForm && (
              <form onSubmit={handleSubmit} className="bg-card rounded-lg border border-border p-6 mb-6 animate-fade-in">
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
                  <input type="number" value={form.costPrice} onChange={e => setForm({...form, costPrice: e.target.value})} placeholder="Custo da bebida (R$)" required step="0.01" min="0"
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
                <div className="flex gap-3 mt-4">
                  <button type="submit" className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:bg-gold-dark transition-colors">
                    {editingProduct ? 'Salvar' : 'Adicionar'}
                  </button>
                  <button type="button" onClick={resetForm} className="px-6 py-2 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors">
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
                      <th className="text-right p-3">Custo</th>
                      <th className="text-right p-3">Venda</th>
                      <th className="text-right p-3">Lucro/un</th>
                      <th className="text-right p-3">Estoque</th>
                      <th className="text-right p-3">Vendidos</th>
                      <th className="text-right p-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id} className="border-t border-border hover:bg-muted/50">
                        <td className="p-3 font-medium text-card-foreground">{p.image} {p.name}</td>
                        <td className="p-3 text-muted-foreground">{p.category}</td>
                        <td className="p-3 text-right text-muted-foreground">R$ {p.costPrice.toFixed(2)}</td>
                        <td className="p-3 text-right text-primary font-medium">R$ {p.price.toFixed(2)}</td>
                        <td className="p-3 text-right text-green-600 font-medium">R$ {(p.price - p.costPrice).toFixed(2)}</td>
                        <td className={`p-3 text-right font-medium ${p.stock <= 5 ? 'text-destructive' : 'text-card-foreground'}`}>{p.stock}</td>
                        <td className="p-3 text-right text-card-foreground">{p.sold}</td>
                        <td className="p-3 text-right">
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => handleEdit(p)} className="p-1.5 rounded-md hover:bg-primary/10 text-primary transition-colors">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive transition-colors">
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
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div>
            {orders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-40" />
                <p>Nenhum pedido ainda.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map(order => (
                  <div key={order.id} className="bg-card rounded-lg border border-border p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-card-foreground">{order.customerName}</h3>
                        <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
                        {order.customerAddress && <p className="text-sm text-muted-foreground">📍 {order.customerAddress}</p>}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        order.status === 'pending' ? 'bg-primary/20 text-primary' :
                        order.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {order.status === 'pending' ? 'Pendente' : order.status === 'confirmed' ? 'Confirmado' : 'Entregue'}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {order.items.map(i => `${i.quantity}x ${i.product.name}`).join(' • ')}
                    </div>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-border">
                      <span className="text-sm text-muted-foreground">
                        {order.paymentMethod === 'pix' ? '📲 PIX' : order.paymentMethod === 'card' ? '💳 Cartão' : '💵 Dinheiro'}
                        {' • '}{order.deliveryType === 'delivery' ? '🏍️ Delivery' : '🏪 Retirada'}
                      </span>
                      <span className="font-bold text-primary">R$ {order.total.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Finance Tab */}
        {activeTab === 'finance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-card rounded-lg border border-border p-6">
                <p className="text-sm text-muted-foreground mb-1">Receita Total</p>
                <p className="font-display text-3xl text-primary">R$ {totalRevenue.toFixed(2)}</p>
              </div>
              <div className="bg-card rounded-lg border border-border p-6">
                <p className="text-sm text-muted-foreground mb-1">Custo Total (Bebidas)</p>
                <p className="font-display text-3xl text-destructive">R$ {totalCost.toFixed(2)}</p>
              </div>
              <div className="bg-card rounded-lg border border-border p-6">
                <p className="text-sm text-muted-foreground mb-1">Lucro Líquido</p>
                <p className="font-display text-3xl text-green-600">R$ {totalProfit.toFixed(2)}</p>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="font-display text-xl mb-4 text-card-foreground">LUCRO POR PRODUTO</h3>
              <div className="space-y-3">
                {products
                  .sort((a, b) => (b.price - b.costPrice) * b.sold - (a.price - a.costPrice) * a.sold)
                  .map(p => {
                    const unitProfit = p.price - p.costPrice;
                    const totalProductProfit = unitProfit * p.sold;
                    const profitPercentage = totalRevenue > 0 ? (totalProductProfit / totalRevenue) * 100 : 0;
                    return (
                      <div key={p.id} className="flex items-center gap-3">
                        <span className="text-xl w-8">{p.image}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium text-card-foreground truncate">{p.name}</span>
                            <span className="text-green-600 font-medium">R$ {totalProductProfit.toFixed(2)}</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-gradient-gold h-2 rounded-full transition-all"
                              style={{ width: `${Math.min(profitPercentage * 3, 100)}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Custo: R${p.costPrice.toFixed(2)} → Venda: R${p.price.toFixed(2)} = Lucro: R${unitProfit.toFixed(2)}/un × {p.sold} vendidos
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="font-display text-xl mb-4 text-card-foreground">ESTOQUE GERAL</h3>
              <p className="text-muted-foreground mb-2">{totalStock} unidades em estoque</p>
              <div className="space-y-2">
                {products
                  .sort((a, b) => a.stock - b.stock)
                  .map(p => (
                    <div key={p.id} className="flex items-center justify-between text-sm">
                      <span className="text-card-foreground">{p.image} {p.name}</span>
                      <span className={`font-medium ${p.stock <= 5 ? 'text-destructive' : p.stock <= 20 ? 'text-primary' : 'text-green-600'}`}>
                        {p.stock} un
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

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
