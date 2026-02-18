import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProducts, DbProduct } from '@/hooks/useProducts';
import Header from '@/components/Header';
import { Pencil, Trash2, Plus, Package, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import ImageUpload from '@/components/ImageUpload';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

const Admin = () => {
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const queryClient = useQueryClient();
  const { user, isAdmin, loading, signOut } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DbProduct | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: '', description: '', price: '', category: '', image: '🍹', stock: '', imageUrl: '',
  });
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setForm({ name: '', description: '', price: '', category: '', image: '🍹', stock: '', imageUrl: '' });
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
    });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const productData = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: parseFloat(form.price),
      category: form.category,
      image_emoji: form.image,
      stock: parseInt(form.stock),
      image_url: form.imageUrl || null,
    };

    if (editingProduct) {
      const { error } = await supabase.from('products').update(productData).eq('id', editingProduct.id);
      if (error) {
        toast.error('Erro ao atualizar produto');
        setSaving(false);
        return;
      }
      toast.success('Produto atualizado!');
    } else {
      const { error } = await supabase.from('products').insert(productData);
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
          <h1 className="font-display text-4xl text-foreground">PAINEL ADM 🦓</h1>
          <button onClick={signOut} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors">
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <StatCard icon={<Package className="h-5 w-5" />} label="Produtos" value={products.length.toString()} />
          <StatCard icon={<Package className="h-5 w-5" />} label="Estoque Total" value={`${totalStock} un`} />
        </div>

        {/* Products */}
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
                <button type="submit" disabled={saving} className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:bg-gold-dark transition-colors disabled:opacity-50">
                  {saving ? 'Salvando...' : editingProduct ? 'Salvar' : 'Adicionar'}
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
                    <th className="text-right p-3">Preço</th>
                    <th className="text-right p-3">Estoque</th>
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
                      <td className={`p-3 text-right font-medium ${(p.stock ?? 0) <= 5 ? 'text-destructive' : 'text-card-foreground'}`}>{p.stock ?? 0}</td>
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
