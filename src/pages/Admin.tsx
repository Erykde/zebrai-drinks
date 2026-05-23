import { useState, useEffect, useRef } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProducts, DbProduct } from '@/hooks/useProducts';
import { Pencil, Trash2, Plus, Package, LogOut, BarChart3, X, MapPin, ClipboardList, QrCode, Ticket, Trophy, Megaphone, Settings, MessageCircle, Menu, Bike, Store, Sparkles, ImagePlus, Loader2, DollarSign, Wallet, PieChart, Receipt, ListTodo } from 'lucide-react';
import DailyTasksManager from '@/components/DailyTasksManager';
import MenuQualityScore from '@/components/MenuQualityScore';
import OrderManager from '@/components/OrderManager';
import DeliveryManager from '@/components/DeliveryManager';
import AdminDashboard from '@/components/AdminDashboard';
import QRCodeCard from '@/components/QRCodeCard';
import CouponsManager from '@/components/CouponsManager';
import LoyaltyManager from '@/components/LoyaltyManager';
import CampaignsManager from '@/components/CampaignsManager';
import SiteSettingsManager from '@/components/SiteSettingsManager';
import StoreConfigManager from '@/components/StoreConfigManager';
import WhatsAppManager from '@/components/WhatsAppManager';
import MotoboyManager from '@/components/MotoboyManager';
import CashRegisterManager from '@/components/CashRegisterManager';
import FinancialSummary from '@/components/FinancialSummary';
import StockManager from '@/components/StockManager';
import ExpensesManager from '@/components/ExpensesManager';
import { toast } from 'sonner';
import ImageUpload from '@/components/ImageUpload';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient, useQuery } from '@tanstack/react-query';

interface FlavorOption {
  name: string;
  image_url?: string;
}

interface MixerOption {
  mixer: string;
  price: number;
  group?: string;
  flavors?: FlavorOption[];
  image_url?: string;
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

type AdminTab = 'orders' | 'products' | 'dashboard' | 'delivery' | 'marketing' | 'whatsapp' | 'settings' | 'store' | 'pricing' | 'cashregister' | 'financial' | 'stock' | 'expenses' | 'tasks';

const Admin = () => {
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user, isAdmin, loading, signOut } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DbProduct | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('orders');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingOrderCount, setPendingOrderCount] = useState(0);

  // Form state
  const [form, setForm] = useState({
    name: '', description: '', price: '', category: '', image: '🍹', stock: '', imageUrl: '', costPrice: '',
    isPromotion: false, promotionPrice: '',
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

  // Customer orders
  const { data: customerOrders = [] } = useQuery({
    queryKey: ['customer-orders-dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_orders')
        .select('id, delivery_fee, total, created_at, status')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Delivery zones
  const { data: deliveryZones = [] } = useQuery({
    queryKey: ['delivery-zones-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_zones')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Real-time pending order count
  useEffect(() => {
    const fetchPending = async () => {
      const { count } = await supabase
        .from('customer_orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      setPendingOrderCount(count ?? 0);
    };
    fetchPending();

    const channel = supabase
      .channel('admin-orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customer_orders' }, () => {
        fetchPending();
        queryClient.invalidateQueries({ queryKey: ['customer-orders-dashboard'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const resetForm = () => {
    setForm({ name: '', description: '', price: '', category: '', image: '🍹', stock: '', imageUrl: '', costPrice: '', isPromotion: false, promotionPrice: '' });
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
      isPromotion: product.is_promotion ?? false,
      promotionPrice: product.promotion_price?.toString() ?? '',
    });
    // Normalize old string[] flavors to FlavorOption[]
    const normalizedMixers: MixerOption[] = (product.mixer_options || []).map(m => ({
      ...m,
      flavors: (m.flavors || []).map(f => typeof f === 'string' ? { name: f } : f) as FlavorOption[],
    }));
    setMixerOptions(normalizedMixers);
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) { toast.error('Erro ao remover produto'); return; }
    queryClient.invalidateQueries({ queryKey: ['products'] });
    toast.success('Produto removido!');
  };

  const addMixer = () => setMixerOptions(prev => [...prev, { mixer: '', price: 0, group: '', flavors: [] }]);
  const removeMixer = (index: number) => setMixerOptions(prev => prev.filter((_, i) => i !== index));
  const updateMixer = (index: number, field: keyof MixerOption, value: string | number | FlavorOption[]) => {
    setMixerOptions(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m));
  };
  const addFlavor = (mixerIndex: number) => {
    setMixerOptions(prev => prev.map((m, i) => i === mixerIndex ? { ...m, flavors: [...(m.flavors || []), { name: '' }] } : m));
  };
  const removeFlavor = (mixerIndex: number, flavorIndex: number) => {
    setMixerOptions(prev => prev.map((m, i) => i === mixerIndex ? { ...m, flavors: (m.flavors || []).filter((_, fi) => fi !== flavorIndex) } : m));
  };
  const updateFlavor = (mixerIndex: number, flavorIndex: number, field: keyof FlavorOption, value: string) => {
    setMixerOptions(prev => prev.map((m, i) => i === mixerIndex ? { ...m, flavors: (m.flavors || []).map((f, fi) => fi === flavorIndex ? { ...f, [field]: value || undefined } : f) } : m));
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
      is_promotion: form.isPromotion,
      promotion_price: form.isPromotion && form.promotionPrice ? parseFloat(form.promotionPrice) : null,
    };

    if (editingProduct) {
      const { error } = await supabase.from('products').update(productData as any).eq('id', editingProduct.id);
      if (error) { toast.error(`Erro ao atualizar: ${error.message}`); setSaving(false); return; }
      toast.success('Produto atualizado!');
    } else {
      const { error } = await supabase.from('products').insert(productData as any);
      if (error) { toast.error('Erro ao adicionar produto'); setSaving(false); return; }
      toast.success('Produto adicionado!');
    }
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['categories'] });
    setSaving(false);
    resetForm();
  };

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

  const navItems: { key: AdminTab; icon: typeof ClipboardList; label: string; badge?: number }[] = [
    { key: 'orders', icon: ClipboardList, label: 'Pedidos', badge: pendingOrderCount },
    { key: 'products', icon: Package, label: 'Produtos' },
    { key: 'stock', icon: Package, label: 'Estoque' },
    { key: 'financial', icon: PieChart, label: 'Financeiro' },
    { key: 'expenses', icon: Receipt, label: 'Despesas' },
    { key: 'dashboard', icon: BarChart3, label: 'Dashboard' },
    { key: 'pricing', icon: DollarSign, label: 'Precificação' },
    { key: 'cashregister', icon: Wallet, label: 'Caixa' },
    { key: 'delivery', icon: Bike, label: 'Entregas' },
    { key: 'marketing', icon: Megaphone, label: 'Marketing' },
    { key: 'whatsapp', icon: MessageCircle, label: 'WhatsApp' },
    { key: 'settings', icon: Settings, label: 'Visual do Site' },
    { key: 'store', icon: Store, label: 'Config. da Loja' },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-card border-r border-border flex flex-col transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-4 border-b border-border">
          <h1 className="font-display text-xl text-primary tracking-wide">🦓 ZEBRAI ADM</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Painel Administrativo</p>
        </div>

        <nav className="flex-1 py-2 overflow-y-auto">
          {navItems.map(({ key, icon: Icon, label, badge }) => (
            <button
              key={key}
              onClick={() => { setActiveTab(key); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === key
                  ? 'bg-primary/10 text-primary border-r-2 border-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="flex-1 text-left">{label}</span>
              {badge != null && badge > 0 && (
                <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center animate-pulse">
                  {badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-h-screen flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 rounded-lg hover:bg-muted">
            <Menu className="h-5 w-5 text-foreground" />
          </button>
          <h2 className="font-display text-lg text-foreground">
            {navItems.find(n => n.key === activeTab)?.label}
          </h2>
          {pendingOrderCount > 0 && activeTab !== 'orders' && (
            <button
              onClick={() => setActiveTab('orders')}
              className="ml-auto flex items-center gap-1.5 bg-destructive/10 text-destructive text-xs font-bold px-3 py-1.5 rounded-full animate-pulse"
            >
              <ClipboardList className="h-3.5 w-3.5" />
              {pendingOrderCount} pedido{pendingOrderCount > 1 ? 's' : ''} novo{pendingOrderCount > 1 ? 's' : ''}
            </button>
          )}
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {activeTab === 'orders' ? (
            <OrderManager />
          ) : activeTab === 'financial' ? (
            <FinancialSummary />
          ) : activeTab === 'expenses' ? (
            <ExpensesManager />
          ) : activeTab === 'dashboard' ? (
            <AdminDashboard orders={orders} products={products} deliveryZones={deliveryZones} customerOrders={customerOrders} />
          ) : activeTab === 'delivery' ? (
            <div className="space-y-6">
              <DeliveryManager />
              <DeliveryTab zones={deliveryZones} queryClient={queryClient} />
              <MotoboyManager />
            </div>
          ) : activeTab === 'marketing' ? (
            <div className="space-y-6">
              <QRCodeCard />
              <CouponsManager />
              <LoyaltyManager />
              <CampaignsManager />
            </div>
          ) : activeTab === 'whatsapp' ? (
            <WhatsAppManager />
          ) : activeTab === 'settings' ? (
            <SiteSettingsManager />
          ) : activeTab === 'store' ? (
            <StoreConfigManager />
          ) : activeTab === 'pricing' ? (
            <PricingTab products={products} queryClient={queryClient} />
          ) : activeTab === 'cashregister' ? (
            <CashRegisterManager />
          ) : activeTab === 'stock' ? (
            <StockManager />
          ) : (
            <ProductsTab
              products={products}
              showForm={showForm}
              editingProduct={editingProduct}
              form={form}
              setForm={setForm}
              mixerOptions={mixerOptions}
              setMixerOptions={setMixerOptions}
              saving={saving}
              onResetForm={resetForm}
              onShowForm={() => { resetForm(); setShowForm(true); }}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onSubmit={handleSubmit}
              onAddMixer={addMixer}
              onRemoveMixer={removeMixer}
              onUpdateMixer={updateMixer}
              onAddFlavor={addFlavor}
              onRemoveFlavor={removeFlavor}
              onUpdateFlavor={updateFlavor}
            />
          )}
        </main>
      </div>
    </div>
  );
};

// === Mixer Image Upload (inline mini component) ===
const MixerImageUpload = ({ currentUrl, onUpload, onRemove }: { currentUrl?: string; onUpload: (url: string) => void; onRemove: () => void }) => {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Selecione uma imagem!'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Imagem muito grande! Máx 5MB.'); return; }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `mixer-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
      onUpload(data.publicUrl);
      toast.success('Foto do mixer enviada!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar foto');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="flex items-center gap-2">
      {currentUrl ? (
        <div className="relative inline-block">
          <img src={currentUrl} alt="Mixer" className="w-12 h-12 rounded-lg object-cover border border-border" />
          <button type="button" onClick={onRemove} className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5">
            <X className="h-2.5 w-2.5" />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
          className="flex items-center gap-1 px-2 py-1 rounded border border-dashed border-input bg-background text-muted-foreground text-xs hover:border-primary hover:text-primary transition-colors">
          {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImagePlus className="h-3 w-3" />}
          {uploading ? 'Enviando...' : '📷 Foto'}
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
    </div>
  );
};

// === Products Tab ===
const ProductsTab = ({
  products, showForm, editingProduct, form, setForm, mixerOptions, setMixerOptions, saving,
  onResetForm, onShowForm, onEdit, onDelete, onSubmit, onAddMixer, onRemoveMixer, onUpdateMixer,
  onAddFlavor, onRemoveFlavor, onUpdateFlavor,
}: {
  products: DbProduct[];
  showForm: boolean;
  editingProduct: DbProduct | null;
  form: any;
  setForm: (f: any) => void;
  mixerOptions: MixerOption[];
  setMixerOptions: (m: MixerOption[]) => void;
  saving: boolean;
  onResetForm: () => void;
  onShowForm: () => void;
  onEdit: (p: DbProduct) => void;
  onDelete: (id: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onAddMixer: () => void;
  onRemoveMixer: (i: number) => void;
  onUpdateMixer: (i: number, f: keyof MixerOption, v: string | number | FlavorOption[]) => void;
  onAddFlavor: (i: number) => void;
  onRemoveFlavor: (mi: number, fi: number) => void;
  onUpdateFlavor: (mi: number, fi: number, field: keyof FlavorOption, v: string) => void;
}) => {
  const [aiLoadingDesc, setAiLoadingDesc] = useState(false);
  const [aiLoadingImg, setAiLoadingImg] = useState(false);

  const generateDescription = async () => {
    if (!form.name.trim()) { toast.error('Preencha o nome do produto primeiro'); return; }
    setAiLoadingDesc(true);
    try {
      const res = await supabase.functions.invoke('ai-product', {
        body: { action: 'description', productName: form.name, category: form.category || 'Drinks' },
      });
      if (res.error) throw res.error;
      const { description, error } = res.data;
      if (error) { toast.error(error); return; }
      setForm({ ...form, description });
      toast.success('Descrição gerada com IA! ✨');
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao gerar descrição');
    } finally {
      setAiLoadingDesc(false);
    }
  };

  const generateImage = async () => {
    if (!form.name.trim()) { toast.error('Preencha o nome do produto primeiro'); return; }
    setAiLoadingImg(true);
    try {
      const res = await supabase.functions.invoke('ai-product', {
        body: { action: 'image', productName: form.name, category: form.category || 'Drinks' },
      });
      if (res.error) throw res.error;
      const { imageUrl, error } = res.data;
      if (error) { toast.error(error); return; }
      setForm({ ...form, imageUrl });
      toast.success('Foto gerada com IA! 📸');
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao gerar foto');
    } finally {
      setAiLoadingImg(false);
    }
  };

  return (
  <div>
    <button
      onClick={onShowForm}
      className="mb-4 flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-colors"
    >
      <Plus className="h-4 w-4" /> Novo Produto
    </button>

    <MenuQualityScore products={products} />

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
          <div className="md:col-span-2 flex gap-2">
            <input value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Descrição" maxLength={200}
              className="flex-1 px-4 py-2 rounded-lg border border-input bg-background text-foreground" />
            <button type="button" onClick={generateDescription} disabled={aiLoadingDesc}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors disabled:opacity-50 whitespace-nowrap">
              {aiLoadingDesc ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              IA
            </button>
          </div>
          <input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="Preço de venda (R$)" required step="0.01" min="0"
            className="px-4 py-2 rounded-lg border border-input bg-background text-foreground" />
          <input type="number" value={form.costPrice} onChange={e => setForm({...form, costPrice: e.target.value})} placeholder="Preço de custo (R$)" step="0.01" min="0"
            className="px-4 py-2 rounded-lg border border-input bg-background text-foreground" />
          <input type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} placeholder="Estoque" required min="0"
            className="px-4 py-2 rounded-lg border border-input bg-background text-foreground" />
          <input value={form.image} onChange={e => setForm({...form, image: e.target.value})} placeholder="Emoji do produto" maxLength={4}
            className="px-4 py-2 rounded-lg border border-input bg-background text-foreground" />

          {/* Promoção */}
          <div className="md:col-span-2 flex flex-col gap-2 p-3 rounded-lg border border-border bg-muted/30">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPromotion}
                onChange={e => setForm({...form, isPromotion: e.target.checked})}
                className="w-4 h-4 accent-destructive"
              />
              <span className="font-medium text-sm text-card-foreground">🔥 Colocar em promoção</span>
            </label>
            {form.isPromotion && (
              <input
                type="number"
                value={form.promotionPrice}
                onChange={e => setForm({...form, promotionPrice: e.target.value})}
                placeholder="Preço promocional (R$)"
                step="0.01"
                min="0"
                required
                className="px-4 py-2 rounded-lg border border-destructive/50 bg-background text-foreground"
              />
            )}
          </div>
          <div className="md:col-span-2">
            <ImageUpload
              currentUrl={form.imageUrl || undefined}
              onUpload={(url) => setForm({...form, imageUrl: url})}
              onRemove={() => setForm({...form, imageUrl: ''})}
            />
            <button type="button" onClick={generateImage} disabled={aiLoadingImg}
              className="mt-2 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors disabled:opacity-50">
              {aiLoadingImg ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
              {aiLoadingImg ? 'Gerando foto...' : 'Gerar foto com IA'}
            </button>
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
             <div className="space-y-4">
              {mixerOptions.map((m, i) => (
                <div key={i} className="border border-border rounded-lg p-3 space-y-2">
                  <div className="flex gap-2 items-center">
                    <input value={m.group || ''} onChange={e => onUpdateMixer(i, 'group', e.target.value)} placeholder="Grupo" className="w-40 px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm" />
                    <input value={m.mixer} onChange={e => onUpdateMixer(i, 'mixer', e.target.value)} placeholder="Nome" className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm" />
                    <input type="number" value={m.price} onChange={e => onUpdateMixer(i, 'price', parseFloat(e.target.value) || 0)} placeholder="Preço" step="0.01" min="0" className="w-24 px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm" />
                    <button type="button" onClick={() => onRemoveMixer(i)} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"><X className="h-4 w-4" /></button>
                  </div>
                  {/* Mixer image upload */}
                  <div className="ml-4">
                    <MixerImageUpload
                      currentUrl={m.image_url}
                      onUpload={(url) => {
                        const updated = [...mixerOptions];
                        updated[i] = { ...updated[i], image_url: url };
                        setMixerOptions(updated);
                      }}
                      onRemove={() => {
                        const updated = [...mixerOptions];
                        updated[i] = { ...updated[i], image_url: undefined };
                        setMixerOptions(updated);
                      }}
                    />
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground">Sabores:</span>
                      <button type="button" onClick={() => onAddFlavor(i)} className="text-xs text-primary hover:underline">+ Sabor</button>
                    </div>
                    {(m.flavors || []).map((f, fi) => (
                      <div key={fi} className="space-y-1 mb-2 p-2 bg-muted/20 rounded-lg">
                        <div className="flex gap-1 items-center">
                          <input value={f.name} onChange={e => onUpdateFlavor(i, fi, 'name', e.target.value)} placeholder="Nome do sabor" className="flex-1 px-2 py-1 rounded border border-input bg-background text-foreground text-xs" />
                          <button type="button" onClick={() => onRemoveFlavor(i, fi)} className="p-1 text-destructive hover:bg-destructive/10 rounded"><X className="h-3 w-3" /></button>
                        </div>
                        <ImageUpload
                          currentUrl={f.image_url}
                          onUpload={(url) => onUpdateFlavor(i, fi, 'image_url', url)}
                          onRemove={() => onUpdateFlavor(i, fi, 'image_url', '')}
                        />
                      </div>
                    ))}
                  </div>
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

    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-secondary-foreground">
            <tr>
              <th className="text-left p-3">Produto</th>
              <th className="text-left p-3">Categoria</th>
              <th className="text-right p-3">Preço</th>
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
                <td className={`p-3 text-right font-medium ${(p.stock ?? 0) <= 5 ? 'text-destructive' : 'text-card-foreground'}`}>{p.stock ?? 0}</td>
                <td className="p-3 text-center text-muted-foreground">{p.mixer_options.length}</td>
                <td className="p-3 text-right">
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => onEdit(p)} className="p-1.5 rounded-md hover:bg-primary/10 text-primary transition-colors"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => onDelete(p.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive transition-colors"><Trash2 className="h-4 w-4" /></button>
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
};

// === Pricing Tab ===
interface Ingredient {
  id?: string;
  name: string;
  cost: number;
  quantity: number;
  unit: string;
  stock: number | null;
}

const PricingTab = ({ products, queryClient }: { products: DbProduct[]; queryClient: any }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loadingIngredients, setLoadingIngredients] = useState(false);
  const [savingIngredients, setSavingIngredients] = useState(false);

  // Fetch ingredients grouped by product
  const { data: allIngredients = [] } = useQuery({
    queryKey: ['product-ingredients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_ingredients' as any)
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const getProductCost = (productId: string) => {
    const prodIngredients = allIngredients.filter((i: any) => i.product_id === productId);
    if (prodIngredients.length === 0) return (products.find(p => p.id === productId) as any)?.cost_price ?? 0;
    return prodIngredients.reduce((sum: number, i: any) => sum + (i.cost * i.quantity), 0);
  };

  const openIngredients = async (productId: string) => {
    if (expandedId === productId) { setExpandedId(null); return; }
    setLoadingIngredients(true);
    const prodIngredients = allIngredients.filter((i: any) => i.product_id === productId);
    setIngredients(prodIngredients.length > 0
      ? prodIngredients.map((i: any) => ({ id: i.id, name: i.name, cost: Number(i.cost), quantity: Number(i.quantity), unit: i.unit, stock: i.stock != null ? Number(i.stock) : null }))
      : [{ name: '', cost: 0, quantity: 1, unit: 'un', stock: null }]
    );
    setExpandedId(productId);
    setLoadingIngredients(false);
  };

  const addIngredient = () => setIngredients(prev => [...prev, { name: '', cost: 0, quantity: 1, unit: 'un', stock: null }]);
  const removeIngredient = (idx: number) => setIngredients(prev => prev.filter((_, i) => i !== idx));
  const updateIngredient = (idx: number, field: keyof Ingredient, value: string | number | null) => {
    setIngredients(prev => prev.map((ing, i) => i === idx ? { ...ing, [field]: value } : ing));
  };

  const applyPrice = async (productId: string, newPrice: number) => {
    const { error } = await supabase.from('products').update({ price: newPrice } as any).eq('id', productId);
    if (error) { toast.error('Erro ao atualizar preço'); return; }
    queryClient.invalidateQueries({ queryKey: ['products'] });
    toast.success(`Preço atualizado para R$ ${newPrice.toFixed(2)}`);
  };

  const saveIngredients = async () => {
    if (!expandedId) return;
    setSavingIngredients(true);
    const validIngredients = ingredients.filter(i => i.name.trim() !== '');

    // Delete existing
    await supabase.from('product_ingredients' as any).delete().eq('product_id', expandedId);

    // Insert new
    if (validIngredients.length > 0) {
      const rows = validIngredients.map(i => ({
        product_id: expandedId,
        name: i.name.trim(),
        cost: i.cost,
        quantity: i.quantity,
        unit: i.unit,
        stock: i.stock,
      }));
      const { error } = await supabase.from('product_ingredients' as any).insert(rows);
      if (error) { toast.error('Erro ao salvar ingredientes'); setSavingIngredients(false); return; }
    }

    // Update product cost_price with total
    const totalCost = validIngredients.reduce((sum, i) => sum + (i.cost * i.quantity), 0);
    await supabase.from('products').update({ cost_price: totalCost } as any).eq('id', expandedId);

    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['product-ingredients'] });
    toast.success('Ingredientes salvos!');
    setSavingIngredients(false);
  };

  const productsWithCost = products.filter(p => getProductCost(p.id) > 0);
  const avgMargin = productsWithCost.length > 0
    ? productsWithCost.reduce((sum, p) => {
        const cost = getProductCost(p.id);
        return sum + ((p.price - cost) / p.price) * 100;
      }, 0) / productsWithCost.length
    : 0;

  return (
    <div>
      <div className="bg-card rounded-lg border border-border p-4 mb-4">
        <p className="text-sm text-foreground font-medium">📋 Como usar:</p>
        <p className="text-xs text-muted-foreground mt-1">
          Clique em um produto → adicione os ingredientes com o preço que você paga → 
          o sistema calcula quanto você deve cobrar para ter lucro.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground">Total de Produtos</p>
          <p className="text-2xl font-bold text-foreground">{products.length}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground">✅ Com custo preenchido</p>
          <p className="text-2xl font-bold text-primary">{productsWithCost.length}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground">⚠️ Falta preencher</p>
          <p className="text-2xl font-bold text-destructive">{products.length - productsWithCost.length}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground">📊 Margem média</p>
          <p className={`text-2xl font-bold ${avgMargin >= 50 ? 'text-green-500' : avgMargin >= 30 ? 'text-yellow-500' : 'text-orange-500'}`}>
            {avgMargin > 0 ? `${avgMargin.toFixed(0)}%` : '—'}
          </p>
        </div>
      </div>

      {/* Product pricing list */}
      <div className="space-y-2">
        {products.map(p => {
          const costPrice = getProductCost(p.id);
          const profit = p.price - costPrice;
          const margin = p.price > 0 ? (profit / p.price) * 100 : 0;
          const isExpanded = expandedId === p.id;
          const prodIngredientCount = allIngredients.filter((i: any) => i.product_id === p.id).length;

          return (
            <div key={p.id} className="bg-card rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => openIngredients(p.id)}
                className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
              >
                <span className="text-lg">{p.image_emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-card-foreground text-sm truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.category} · {prodIngredientCount > 0 ? `${prodIngredientCount} ingredientes` : 'sem ingredientes'}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium text-primary">R$ {p.price.toFixed(2)}</p>
                  {costPrice > 0 ? (
                    <>
                      {profit < 0 && (
                        <p className="text-[10px] font-bold text-destructive animate-pulse">⚠️ PREJUÍZO!</p>
                      )}
                      <p className={`text-xs font-semibold ${margin >= 50 ? 'text-green-500' : margin >= 30 ? 'text-yellow-500' : profit < 0 ? 'text-destructive' : 'text-orange-500'}`}>
                        Lucro R$ {profit.toFixed(2)} ({margin.toFixed(0)}%)
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-destructive/60 italic">sem custo</p>
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-border p-3 bg-muted/30 animate-fade-in">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">📦 O QUE VOCÊ GASTA NESTE PRODUTO</p>
                  <p className="text-[10px] text-muted-foreground mb-2">Adicione tudo que vai no produto e quanto custa cada coisa</p>
                  <div className="space-y-2">
                    {ingredients.map((ing, idx) => (
                      <div key={idx} className="space-y-1.5 p-2 rounded border border-border/50 bg-background/40">
                        <div className="flex gap-2 items-center">
                          <input
                            value={ing.name}
                            onChange={e => updateIngredient(idx, 'name', e.target.value)}
                            placeholder="Nome (ex: Leite, Vodka...)"
                            className="flex-1 px-2 py-1.5 rounded border border-input bg-background text-foreground text-xs"
                          />
                          <input
                            type="number"
                            value={ing.quantity}
                            onChange={e => updateIngredient(idx, 'quantity', parseFloat(e.target.value) || 0)}
                            placeholder="Qtd"
                            step="0.1"
                            min="0"
                            className="w-14 px-2 py-1.5 rounded border border-input bg-background text-foreground text-xs text-center"
                          />
                          <select
                            value={ing.unit}
                            onChange={e => updateIngredient(idx, 'unit', e.target.value)}
                            className="w-16 px-1 py-1.5 rounded border border-input bg-background text-foreground text-xs"
                          >
                            <option value="un">un</option>
                            <option value="ml">ml</option>
                            <option value="L">L</option>
                            <option value="g">g</option>
                            <option value="kg">kg</option>
                          </select>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">R$</span>
                            <input
                              type="number"
                              value={ing.cost}
                              onChange={e => updateIngredient(idx, 'cost', parseFloat(e.target.value) || 0)}
                              placeholder="Custo"
                              step="0.01"
                              min="0"
                              className="w-16 px-2 py-1.5 rounded border border-input bg-background text-foreground text-xs text-right"
                            />
                          </div>
                          <button onClick={() => removeIngredient(idx)} className="p-1 text-destructive hover:bg-destructive/10 rounded">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 pl-1">
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">📦 Estoque</span>
                          <input
                            type="number"
                            value={ing.stock ?? ''}
                            onChange={e => updateIngredient(idx, 'stock', e.target.value === '' ? null : parseFloat(e.target.value))}
                            placeholder="(não controlar)"
                            step="0.1"
                            min="0"
                            className="w-24 px-2 py-1 rounded border border-input bg-background text-foreground text-xs text-right"
                          />
                          <span className="text-[10px] text-muted-foreground">{ing.unit}</span>
                          {ing.stock != null && ing.stock <= ing.quantity * 3 && (
                            <span className="text-[10px] font-bold text-destructive">⚠️ Acabando!</span>
                          )}
                          <span className="text-[10px] text-muted-foreground ml-auto">
                            {ing.stock != null && ing.quantity > 0
                              ? `≈ ${Math.floor(ing.stock / ing.quantity)} pedidos restantes`
                              : 'estoque livre'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Suggested prices */}
                  {(() => {
                    const totalCost = ingredients.reduce((s, i) => s + (i.cost * i.quantity), 0);
                    if (totalCost <= 0) return null;
                    const suggestions = [
                      { label: '30%', price: totalCost * 1.30, color: 'text-orange-500', desc: 'Mínimo' },
                      { label: '50%', price: totalCost * 1.50, color: 'text-yellow-500', desc: 'Bom' },
                      { label: '100%', price: totalCost * 2.00, color: 'text-green-500', desc: 'Ideal' },
                    ];
                    return (
                      <div className="mt-3 pt-2 border-t border-border">
                        <p className="text-[10px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">💡 Por quanto você deveria vender</p>
                        <div className="grid grid-cols-3 gap-2">
                          {suggestions.map(s => {
                            const rounded = Math.round(s.price * 100) / 100;
                            return (
                              <div key={s.label} className={`rounded-lg border border-border p-2 text-center flex flex-col gap-1.5 ${p.price < s.price ? 'bg-destructive/5 border-destructive/30' : 'bg-muted/50'}`}>
                                <p className="text-[10px] text-muted-foreground">{s.desc}</p>
                                <p className={`text-sm font-bold ${s.color}`}>R$ {s.price.toFixed(2)}</p>
                                <p className="text-[10px] text-muted-foreground">Margem {s.label}</p>
                                <button
                                  onClick={() => applyPrice(p.id, rounded)}
                                  className="text-[10px] font-semibold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded px-1.5 py-1 transition-colors"
                                >
                                  Usar este preço
                                </button>
                              </div>
                            );
                          })}
                        </div>
                        {p.price < totalCost && (
                          <div className="mt-2 bg-destructive/10 border border-destructive/30 rounded-lg p-2 text-center">
                            <p className="text-xs font-bold text-destructive">⚠️ Preço atual (R$ {p.price.toFixed(2)}) está ABAIXO do custo (R$ {totalCost.toFixed(2)})</p>
                            <p className="text-[10px] text-destructive/80">Aumente o preço para pelo menos R$ {(totalCost * 1.30).toFixed(2)}</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
                    <button onClick={addIngredient} className="text-xs text-primary hover:underline flex items-center gap-1">
                      <Plus className="h-3 w-3" /> Adicionar item
                    </button>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-foreground">
                        Custo total: R$ {ingredients.reduce((s, i) => s + (i.cost * i.quantity), 0).toFixed(2)}
                      </span>
                      <button
                        onClick={saveIngredients}
                        disabled={savingIngredients}
                        className="bg-primary text-primary-foreground px-3 py-1.5 rounded text-xs font-medium hover:opacity-90 disabled:opacity-50"
                      >
                        {savingIngredients ? 'Salvando...' : 'Salvar'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};


const DeliveryTab = ({ zones, queryClient }: { zones: any[]; queryClient: any }) => {
  const [editingZone, setEditingZone] = useState<any | null>(null);
  const [showZoneForm, setShowZoneForm] = useState(false);
  const [zoneForm, setZoneForm] = useState({ zone_name: '', min_km: '', max_km: '', fee: '', sort_order: '' });
  const [saving, setSaving] = useState(false);

  const resetZoneForm = () => { setZoneForm({ zone_name: '', min_km: '', max_km: '', fee: '', sort_order: '' }); setEditingZone(null); setShowZoneForm(false); };

  const handleEditZone = (zone: any) => {
    setZoneForm({ zone_name: zone.zone_name, min_km: zone.min_km.toString(), max_km: zone.max_km.toString(), fee: zone.fee.toString(), sort_order: zone.sort_order.toString() });
    setEditingZone(zone);
    setShowZoneForm(true);
  };

  const handleDeleteZone = async (id: string) => {
    const { error } = await supabase.from('delivery_zones').delete().eq('id', id);
    if (error) { toast.error('Erro ao remover zona'); return; }
    queryClient.invalidateQueries({ queryKey: ['delivery-zones-admin'] });
    queryClient.invalidateQueries({ queryKey: ['delivery-zones'] });
    toast.success('Zona removida!');
  };

  const handleSubmitZone = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const data = { zone_name: zoneForm.zone_name.trim(), min_km: parseFloat(zoneForm.min_km), max_km: parseFloat(zoneForm.max_km), fee: parseFloat(zoneForm.fee), sort_order: parseInt(zoneForm.sort_order) || 0, is_active: true };
    if (editingZone) {
      const { error } = await supabase.from('delivery_zones').update(data as any).eq('id', editingZone.id);
      if (error) { toast.error('Erro ao atualizar zona'); setSaving(false); return; }
      toast.success('Zona atualizada!');
    } else {
      const { error } = await supabase.from('delivery_zones').insert(data as any);
      if (error) { toast.error('Erro ao adicionar zona'); setSaving(false); return; }
      toast.success('Zona adicionada!');
    }
    queryClient.invalidateQueries({ queryKey: ['delivery-zones-admin'] });
    queryClient.invalidateQueries({ queryKey: ['delivery-zones'] });
    setSaving(false);
    resetZoneForm();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl text-foreground">Regiões de Entrega</h2>
        <button onClick={() => { resetZoneForm(); setShowZoneForm(true); }} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium text-sm hover:opacity-90 transition-colors">
          <Plus className="h-4 w-4" /> Nova Região
        </button>
      </div>
      <p className="text-sm text-muted-foreground mb-4">📍 Referência: Rua Monte Sinai 38, Costeira, São José dos Pinhais</p>
      {showZoneForm && (
        <form onSubmit={handleSubmitZone} className="bg-card rounded-lg border border-border p-6 mb-6 animate-fade-in">
          <h3 className="font-display text-lg mb-4 text-card-foreground">{editingZone ? 'EDITAR REGIÃO' : 'NOVA REGIÃO'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input value={zoneForm.zone_name} onChange={e => setZoneForm({...zoneForm, zone_name: e.target.value})} placeholder="Nome da região" required className="px-4 py-2 rounded-lg border border-input bg-background text-foreground md:col-span-2" />
            <input type="number" value={zoneForm.min_km} onChange={e => setZoneForm({...zoneForm, min_km: e.target.value})} placeholder="Distância mín (km)" required step="0.1" min="0" className="px-4 py-2 rounded-lg border border-input bg-background text-foreground" />
            <input type="number" value={zoneForm.max_km} onChange={e => setZoneForm({...zoneForm, max_km: e.target.value})} placeholder="Distância máx (km)" required step="0.1" min="0" className="px-4 py-2 rounded-lg border border-input bg-background text-foreground" />
            <input type="number" value={zoneForm.fee} onChange={e => setZoneForm({...zoneForm, fee: e.target.value})} placeholder="Taxa (R$)" required step="0.01" min="0" className="px-4 py-2 rounded-lg border border-input bg-background text-foreground" />
            <input type="number" value={zoneForm.sort_order} onChange={e => setZoneForm({...zoneForm, sort_order: e.target.value})} placeholder="Ordem" min="0" className="px-4 py-2 rounded-lg border border-input bg-background text-foreground" />
          </div>
          <div className="flex gap-3 mt-4">
            <button type="submit" disabled={saving} className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:opacity-90 transition-colors disabled:opacity-50">{saving ? 'Salvando...' : editingZone ? 'Salvar' : 'Adicionar'}</button>
            <button type="button" onClick={resetZoneForm} className="px-6 py-2 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors">Cancelar</button>
          </div>
        </form>
      )}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-secondary-foreground">
              <tr>
                <th className="text-left p-3">Região</th>
                <th className="text-center p-3">Distância</th>
                <th className="text-right p-3">Taxa</th>
                <th className="text-right p-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {zones.map(z => (
                <tr key={z.id} className="border-t border-border hover:bg-muted/50">
                  <td className="p-3 font-medium text-card-foreground">{z.zone_name}</td>
                  <td className="p-3 text-center text-muted-foreground">{z.min_km}-{z.max_km} km</td>
                  <td className="p-3 text-right text-primary font-medium">{z.fee === 0 ? 'Grátis' : `R$ ${Number(z.fee).toFixed(2)}`}</td>
                  <td className="p-3 text-right">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => handleEditZone(z)} className="p-1.5 rounded-md hover:bg-primary/10 text-primary transition-colors"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDeleteZone(z.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive transition-colors"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {zones.length === 0 && (
                <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Nenhuma região cadastrada.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Admin;
