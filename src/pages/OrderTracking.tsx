import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import zebraRunning from '@/assets/zebra-running.png';
import zebraMixing from '@/assets/zebra-mixing.png';
import zebraDelivery from '@/assets/zebra-delivery.png';
import { Phone, Search, ArrowLeft, Clock } from 'lucide-react';

interface OrderData {
  id: string;
  customer_name: string;
  status: string;
  total: number;
  delivery_fee: number;
  customer_address: string | null;
  created_at: string;
  items: { product_name: string; quantity: number; unit_price: number; total: number }[];
}

const statusConfig = {
  pending: {
    label: '⏳ Aguardando confirmação...',
    description: 'Seu pedido foi enviado! A Zebrai já recebeu e vai confirmar em breve.',
    image: zebraRunning,
    imageAlt: 'Zebra correndo',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    step: 1,
  },
  preparing: {
    label: '🍹 Preparando seu pedido!',
    description: 'A Zebrai está preparando suas bebidas com carinho!',
    image: zebraMixing,
    imageAlt: 'Zebra preparando drinks',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    step: 2,
  },
  out_for_delivery: {
    label: '🏍️ Saiu para entrega!',
    description: 'A Zebrai está a caminho! Já já chega aí!',
    image: zebraDelivery,
    imageAlt: 'Zebra na moto',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    step: 3,
  },
  delivered: {
    label: '✅ Entregue!',
    description: 'Pedido entregue com sucesso! Aproveite! 🎉',
    image: zebraDelivery,
    imageAlt: 'Zebra entregou',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    step: 4,
  },
  cancelled: {
    label: '❌ Cancelado',
    description: 'Infelizmente seu pedido foi cancelado.',
    image: zebraRunning,
    imageAlt: 'Zebra triste',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    step: 0,
  },
};

const steps = [
  { key: 'pending', label: 'Recebido' },
  { key: 'preparing', label: 'Preparando' },
  { key: 'out_for_delivery', label: 'A caminho' },
  { key: 'delivered', label: 'Entregue' },
];

const statusLabels: Record<string, string> = {
  pending: '⏳ Pendente',
  preparing: '🍹 Preparando',
  out_for_delivery: '🏍️ A caminho',
  delivered: '✅ Entregue',
  cancelled: '❌ Cancelado',
};

const OrderTracking = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('id');
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(!!orderId);

  // History mode
  const [phoneSearch, setPhoneSearch] = useState('');
  const [orderHistory, setOrderHistory] = useState<OrderData[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(!orderId);

  // Load saved phone
  useEffect(() => {
    if (!orderId) {
      try {
        const saved = localStorage.getItem('zebrai-customer-data');
        if (saved) {
          const { phone } = JSON.parse(saved);
          if (phone) {
            setPhoneSearch(phone);
            searchByPhone(phone);
          }
        }
      } catch {}
    }
  }, []);

  const fetchOrder = async () => {
    if (!orderId) return;
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const response = await fetch(
        `${supabaseUrl}/functions/v1/get-order?id=${encodeURIComponent(orderId)}`,
        { headers: { 'apikey': anonKey } }
      );
      if (!response.ok) { setLoading(false); return; }
      const orderData = await response.json();
      setOrder(orderData);
    } catch (e) {
      console.error('Error fetching order:', e);
    }
    setLoading(false);
  };

  const searchByPhone = async (phone?: string) => {
    const searchPhone = (phone || phoneSearch).replace(/\D/g, '');
    if (searchPhone.length < 10) return;
    setLoadingHistory(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const response = await fetch(
        `${supabaseUrl}/functions/v1/get-order?phone=${encodeURIComponent(searchPhone)}`,
        { headers: { 'apikey': anonKey } }
      );
      if (response.ok) {
        const data = await response.json();
        setOrderHistory(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Error searching orders:', e);
    }
    setLoadingHistory(false);
  };

  useEffect(() => {
    if (orderId) {
      fetchOrder();
      const interval = setInterval(fetchOrder, 5000);
      return () => clearInterval(interval);
    }
  }, [orderId]);

  // History view
  if (showHistory && !orderId) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-card border-b border-border p-4 text-center">
          <h1 className="font-display text-2xl text-foreground">🦓 ZEBRAI DRINKS</h1>
          <p className="text-sm text-muted-foreground">Seus pedidos</p>
        </div>

        <div className="max-w-md mx-auto p-4 space-y-4 animate-fade-in">
          {/* Phone search */}
          <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Phone className="h-3.5 w-3.5" /> Buscar pedidos pelo telefone
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="tel"
                  value={phoneSearch}
                  onChange={e => setPhoneSearch(e.target.value)}
                  placeholder="(99) 99999-9999"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-background text-foreground focus:ring-2 focus:ring-ring outline-none text-sm"
                  maxLength={20}
                  onKeyDown={e => e.key === 'Enter' && searchByPhone()}
                />
              </div>
              <button
                onClick={() => searchByPhone()}
                disabled={loadingHistory}
                className="bg-primary text-primary-foreground px-4 py-3 rounded-xl font-medium text-sm hover:opacity-90 transition-colors disabled:opacity-50"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Order history list */}
          {loadingHistory ? (
            <div className="text-center py-8">
              <img src={zebraRunning} alt="Carregando" className="w-20 h-20 mx-auto animate-bounce" />
              <p className="text-muted-foreground mt-2 text-sm">Buscando pedidos...</p>
            </div>
          ) : orderHistory.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{orderHistory.length} pedido(s) encontrado(s)</p>
              {orderHistory.map(o => (
                <button
                  key={o.id}
                  onClick={() => {
                    setShowHistory(false);
                    navigate(`/pedido?id=${o.id}`);
                  }}
                  className="w-full bg-card rounded-xl border border-border p-4 text-left hover:border-primary/50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Pedido #{o.id.substring(0, 8)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(o.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-xs mt-1">{statusLabels[o.status] || o.status}</p>
                    </div>
                    <span className="text-primary font-bold text-sm">R$ {o.total.toFixed(2)}</span>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {o.items?.map(i => `${i.quantity}x ${i.product_name}`).join(', ')}
                  </div>
                </button>
              ))}
            </div>
          ) : phoneSearch.replace(/\D/g, '').length >= 10 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">Nenhum pedido encontrado para este telefone.</p>
          ) : null}

          <button
            onClick={() => navigate('/')}
            className="w-full py-3 rounded-xl bg-muted text-muted-foreground font-medium hover:bg-muted/80 transition-colors"
          >
            ← Voltar ao cardápio
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <img src={zebraRunning} alt="Carregando" className="w-32 h-32 mx-auto animate-bounce" />
          <p className="text-muted-foreground mt-4">Carregando pedido...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-xl text-foreground">Pedido não encontrado 😕</p>
          <button onClick={() => navigate('/')} className="mt-4 text-primary underline">
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  const status = order.status as keyof typeof statusConfig;
  const config = statusConfig[status] || statusConfig.pending;
  const currentStep = config.step;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border p-4 text-center">
        <h1 className="font-display text-2xl text-foreground">🦓 ZEBRAI DRINKS</h1>
        <p className="text-sm text-muted-foreground">Acompanhe seu pedido</p>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6 animate-fade-in">
        {/* Status principal com imagem */}
        <div className={`rounded-2xl border-2 ${config.borderColor} ${config.bgColor} p-6 text-center`}>
          <img
            src={config.image}
            alt={config.imageAlt}
            className={`w-40 h-40 mx-auto mb-4 ${status === 'pending' ? 'animate-pulse' : status === 'out_for_delivery' ? 'animate-bounce' : ''}`}
          />
          <h2 className={`text-xl font-bold ${config.color}`}>{config.label}</h2>
          <p className="text-muted-foreground mt-2 text-sm">{config.description}</p>
        </div>

        {/* Progress steps */}
        {status !== 'cancelled' && (
          <div className="flex items-center justify-between px-2">
            {steps.map((step, i) => {
              const isActive = currentStep >= i + 1;
              const isCurrent = currentStep === i + 1;
              return (
                <div key={step.key} className="flex flex-col items-center flex-1">
                  <div className="flex items-center w-full">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${
                        isActive
                          ? 'bg-primary text-primary-foreground scale-110'
                          : 'bg-muted text-muted-foreground'
                      } ${isCurrent ? 'ring-4 ring-primary/30' : ''}`}
                    >
                      {isActive ? '✓' : i + 1}
                    </div>
                    {i < steps.length - 1 && (
                      <div className={`flex-1 h-1 mx-1 rounded transition-all duration-500 ${
                        currentStep > i + 1 ? 'bg-primary' : 'bg-muted'
                      }`} />
                    )}
                  </div>
                  <span className={`text-[10px] mt-1 ${isActive ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Detalhes do pedido */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            📋 Detalhes do Pedido
          </h3>
          <div className="text-sm text-muted-foreground">
            <p>👤 <span className="text-foreground font-medium">{order.customer_name}</span></p>
            {order.customer_address && (
              <p className="mt-1">📍 {order.customer_address}</p>
            )}
          </div>

          <div className="border-t border-border pt-3 space-y-2">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-foreground">
                  {item.quantity}x {item.product_name}
                </span>
                <span className="text-muted-foreground">R$ {item.total.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-3 flex justify-between font-bold">
            <span className="text-foreground">Total</span>
            <span className="text-primary">R$ {order.total.toFixed(2)}</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-2">
          <button
            onClick={() => { setShowHistory(true); navigate('/pedido'); }}
            className="w-full py-3 rounded-xl bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors"
          >
            📋 Ver meus pedidos
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 rounded-xl bg-muted text-muted-foreground font-medium hover:bg-muted/80 transition-colors"
          >
            ← Voltar ao cardápio
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
