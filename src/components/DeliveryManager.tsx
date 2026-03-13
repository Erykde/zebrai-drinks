import { useState } from 'react';
import { useCustomerOrders, CustomerOrder } from '@/hooks/useCustomerOrders';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Bike, MapPin, Phone, User, AlertTriangle, ChevronDown, ChevronUp, CheckCircle, Clock, ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface Motoboy {
  id: string;
  name: string;
  phone: string;
  is_active: boolean;
}

const PRIORITY_CONFIG = {
  urgent: { label: '🔴 Urgente', color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/30', sortOrder: 0 },
  normal: { label: '🟡 Normal', color: 'text-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500/30', sortOrder: 1 },
  low: { label: '🟢 Baixa', color: 'text-green-500', bg: 'bg-green-500/10 border-green-500/30', sortOrder: 2 },
} as const;

type Priority = keyof typeof PRIORITY_CONFIG;

const DeliveryManager = () => {
  const { data: orders = [] } = useCustomerOrders();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'priority' | 'motoboy'>('priority');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const { data: motoboys = [] } = useQuery({
    queryKey: ['motoboys-active'],
    queryFn: async (): Promise<Motoboy[]> => {
      const { data, error } = await supabase
        .from('motoboys')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data ?? [];
    },
  });

  // Only show active delivery orders (not delivered/cancelled)
  const activeOrders = orders.filter(o =>
    ['pending', 'preparing', 'out_for_delivery'].includes(o.status)
  );

  const setPriority = async (orderId: string, priority: Priority) => {
    const { error } = await supabase
      .from('customer_orders')
      .update({ priority } as any)
      .eq('id', orderId);

    if (error) {
      toast.error('Erro ao atualizar prioridade');
      return;
    }
    toast.success(`Prioridade: ${PRIORITY_CONFIG[priority].label}`);
    queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
  };

  const assignMotoboy = async (orderId: string, motoboyId: string) => {
    const order = orders.find(o => o.id === orderId);
    const motoboy = motoboys.find(m => m.id === motoboyId);
    if (!order || !motoboy) return;

    const token = crypto.randomUUID().replace(/-/g, '').substring(0, 16);
    const siteUrl = window.location.origin;
    const deliveryLink = `${siteUrl}/entrega?token=${token}`;

    const { error } = await supabase
      .from('customer_orders')
      .update({ motoboy_id: motoboyId, delivery_token: token, status: 'out_for_delivery' } as any)
      .eq('id', orderId);

    if (error) {
      toast.error('Erro ao atribuir motoboy');
      return;
    }

    const itemsText = (order.items || [])
      .map(i => `*${i.quantity}x* ${i.product_name}${i.mixer ? ` + ${i.mixer}` : ''} - R$ ${i.total.toFixed(2)}`)
      .join('\n');

    const message = `🏍️ *NOVA ENTREGA!*\n\n` +
      `📋 *Pedido #${orderId.substring(0, 8)}*\n` +
      `👤 Cliente: *${order.customer_name}*\n` +
      (order.customer_phone ? `📱 Tel: ${order.customer_phone}\n` : '') +
      (order.customer_address ? `📍 Endereço: *${order.customer_address}*\n` : '') +
      `\n${itemsText}\n\n` +
      `💲 *Total: R$ ${order.total.toFixed(2)}*\n` +
      (order.delivery_fee > 0 ? `🛵 Entrega: R$ ${order.delivery_fee.toFixed(2)}\n` : '') +
      (order.notes ? `\n📝 Obs: ${order.notes}\n` : '') +
      `\n✅ *Confirmar entrega:*\n${deliveryLink}`;

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      await fetch(`${supabaseUrl}/functions/v1/whatsapp-send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: anonKey },
        body: JSON.stringify({ phone: motoboy.phone, message }),
      });
      toast.success(`Pedido enviado para ${motoboy.name}! 🏍️`);
    } catch {
      toast.success('Motoboy atribuído (WhatsApp indisponível)');
    }

    queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
  };

  const getOrderPriority = (order: CustomerOrder): Priority => {
    return ((order as any).priority as Priority) || 'normal';
  };

  // Sort by priority
  const sortedOrders = [...activeOrders].sort((a, b) => {
    const pa = PRIORITY_CONFIG[getOrderPriority(a)]?.sortOrder ?? 1;
    const pb = PRIORITY_CONFIG[getOrderPriority(b)]?.sortOrder ?? 1;
    if (pa !== pb) return pa - pb;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  // Group by motoboy
  const groupedByMotoboy = activeOrders.reduce<Record<string, CustomerOrder[]>>((acc, o) => {
    const key = (o as any).motoboy_id || 'unassigned';
    if (!acc[key]) acc[key] = [];
    acc[key].push(o);
    return acc;
  }, {});

  const getMotoboyName = (id: string) => {
    if (id === 'unassigned') return '🔲 Sem motoboy';
    return motoboys.find(m => m.id === id)?.name || 'Motoboy desconhecido';
  };

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const renderOrderCard = (order: CustomerOrder) => {
    const priority = getOrderPriority(order);
    const priorityConfig = PRIORITY_CONFIG[priority];
    const isExpanded = expandedOrder === order.id;
    const assignedMotoboy = motoboys.find(m => m.id === (order as any).motoboy_id);

    return (
      <div key={order.id} className={`rounded-lg border ${priorityConfig.bg} overflow-hidden transition-all`}>
        <button
          onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
          className="w-full flex items-center justify-between p-3 text-left"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm">{priorityConfig.label.split(' ')[0]}</span>
            <div className="min-w-0">
              <p className="font-medium text-card-foreground truncate text-sm">{order.customer_name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {order.customer_address ? `📍 ${order.customer_address}` : 'Sem endereço'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-sm font-bold text-primary">{fmt(order.total)}</span>
            {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </button>

        {isExpanded && (
          <div className="px-3 pb-3 space-y-3 border-t border-border/50 pt-3">
            {/* Customer info */}
            <div className="flex flex-wrap gap-3 text-xs">
              <span className="flex items-center gap-1 text-muted-foreground">
                <User className="h-3 w-3" /> {order.customer_name}
              </span>
              {order.customer_phone && (
                <a href={`tel:${order.customer_phone}`} className="flex items-center gap-1 text-primary">
                  <Phone className="h-3 w-3" /> {order.customer_phone}
                </a>
              )}
              {order.customer_address && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {order.customer_address}
                </span>
              )}
            </div>

            {/* Items */}
            <div className="bg-background/50 rounded-lg p-2 text-xs">
              {order.items?.map(item => (
                <div key={item.id} className="flex justify-between py-0.5">
                  <span className="text-card-foreground">
                    {item.quantity}x {item.product_name}
                  </span>
                  <span className="text-primary font-medium">{fmt(item.total)}</span>
                </div>
              ))}
            </div>

            {order.notes && (
              <p className="text-xs text-muted-foreground italic">📝 {order.notes}</p>
            )}

            {assignedMotoboy && (
              <p className="text-xs text-purple-500 font-medium">🏍️ {assignedMotoboy.name}</p>
            )}

            {/* Priority buttons */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-semibold uppercase">Prioridade</p>
              <div className="flex gap-1">
                {(Object.keys(PRIORITY_CONFIG) as Priority[]).map(p => (
                  <button
                    key={p}
                    onClick={() => setPriority(order.id, p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      priority === p
                        ? `${PRIORITY_CONFIG[p].bg} ${PRIORITY_CONFIG[p].color} border`
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {PRIORITY_CONFIG[p].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Assign motoboy */}
            {order.status !== 'out_for_delivery' && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-semibold uppercase">Enviar para motoboy</p>
                <div className="flex flex-wrap gap-1">
                  {motoboys.map(m => (
                    <button
                      key={m.id}
                      onClick={() => assignMotoboy(order.id, m.id)}
                      className="bg-purple-500/10 border border-purple-500/30 text-purple-500 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-purple-500/20 transition-colors"
                    >
                      🏍️ {m.name}
                    </button>
                  ))}
                  {motoboys.length === 0 && (
                    <span className="text-xs text-muted-foreground">Cadastre motoboys primeiro</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* View mode toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setViewMode('priority')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'priority'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          <AlertTriangle className="h-4 w-4 inline mr-1" />
          Por Prioridade
        </button>
        <button
          onClick={() => setViewMode('motoboy')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'motoboy'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          <Bike className="h-4 w-4 inline mr-1" />
          Por Motoboy
        </button>
      </div>

      {activeOrders.length === 0 ? (
        <p className="text-muted-foreground text-center py-12 text-sm">Nenhuma entrega ativa.</p>
      ) : viewMode === 'priority' ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{activeOrders.length} entrega(s) ativa(s)</p>
          {sortedOrders.map(renderOrderCard)}
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedByMotoboy).map(([motoboyId, motoboyOrders]) => (
            <div key={motoboyId} className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <Bike className="h-4 w-4 text-purple-500" />
                <h3 className="text-sm font-bold text-foreground">{getMotoboyName(motoboyId)}</h3>
                <span className="text-xs text-muted-foreground">({motoboyOrders.length})</span>
              </div>
              {motoboyOrders.map(renderOrderCard)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeliveryManager;
