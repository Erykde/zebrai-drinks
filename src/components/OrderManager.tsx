import { useState } from 'react';
import { useCustomerOrders, CustomerOrder } from '@/hooks/useCustomerOrders';
import { Clock, ChefHat, Truck, CheckCircle, XCircle, Phone, MapPin, User, ChevronDown, ChevronUp, Pencil, Trash2, Save, X, Bike } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient, useQuery } from '@tanstack/react-query';

interface Motoboy {
  id: string;
  name: string;
  phone: string;
  is_active: boolean;
}

const STATUS_CONFIG = {
  pending: { label: 'Pendente', icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500/30' },
  preparing: { label: 'Preparando', icon: ChefHat, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/30' },
  out_for_delivery: { label: 'Saiu p/ Entrega', icon: Truck, color: 'text-purple-500', bg: 'bg-purple-500/10 border-purple-500/30' },
  delivered: { label: 'Entregue', icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10 border-green-500/30' },
  cancelled: { label: 'Cancelado', icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/30' },
} as const;

const STATUS_FLOW: CustomerOrder['status'][] = ['pending', 'preparing', 'out_for_delivery', 'delivered'];

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const OrderManager = () => {
  const { data: orders = [], isLoading, updateStatus } = useCustomerOrders();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<CustomerOrder['status'] | 'all'>('all');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [editingOrder, setEditingOrder] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ customer_name: '', customer_phone: '', customer_address: '', notes: '' });
  const [deletingOrder, setDeletingOrder] = useState<string | null>(null);
  const [assigningMotoboy, setAssigningMotoboy] = useState<string | null>(null);

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

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  const activeCount = (status: CustomerOrder['status']) => orders.filter(o => o.status === status).length;

  const sendWhatsAppNotification = async (order: CustomerOrder, newStatus: CustomerOrder['status']) => {
    if (!order.customer_phone) return;

    const templateMap: Record<string, string> = {
      preparing: 'order_confirmed',
      out_for_delivery: 'order_delivering',
      delivered: 'order_delivered',
    };

    const template = templateMap[newStatus];
    if (!template) return;

    const itemsText = (order.items || [])
      .map(i => `*${i.quantity}x* ${i.product_name}${i.mixer ? ` + ${i.mixer}` : ''} - R$ ${i.total.toFixed(2)}`)
      .join('\n');

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      await fetch(`${supabaseUrl}/functions/v1/whatsapp-send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': anonKey,
        },
        body: JSON.stringify({
          phone: order.customer_phone,
          template,
          template_data: {
            customer_name: order.customer_name,
            order_id: order.id.substring(0, 8),
            total: order.total.toFixed(2),
            delivery_fee: order.delivery_fee.toFixed(2),
            order_items: itemsText,
            payment_method: 'Informado no pedido',
          },
        }),
      });
    } catch (e) {
      console.error('WhatsApp notification error:', e);
    }
  };

  const handleStatusChange = (orderId: string, newStatus: CustomerOrder['status']) => {
    const order = orders.find(o => o.id === orderId);
    updateStatus.mutate(
      { orderId, status: newStatus },
      {
        onSuccess: () => {
          toast.success(`Status atualizado para: ${STATUS_CONFIG[newStatus].label}`);
          if (order) sendWhatsAppNotification(order, newStatus);
        },
        onError: () => toast.error('Erro ao atualizar status'),
      }
    );
  };

  const getNextStatus = (current: CustomerOrder['status']): CustomerOrder['status'] | null => {
    const idx = STATUS_FLOW.indexOf(current);
    if (idx === -1 || idx === STATUS_FLOW.length - 1) return null;
    return STATUS_FLOW[idx + 1];
  };

  const generateToken = () => {
    return crypto.randomUUID().replace(/-/g, '').substring(0, 16);
  };

  const assignMotoboyAndSend = async (orderId: string, motoboyId: string) => {
    const order = orders.find(o => o.id === orderId);
    const motoboy = motoboys.find(m => m.id === motoboyId);
    if (!order || !motoboy) return;

    // Generate delivery token
    const token = generateToken();
    const siteUrl = window.location.origin;
    const deliveryLink = `${siteUrl}/entrega?token=${token}`;

    // Update order with motoboy and token, set status to out_for_delivery
    const { error } = await supabase
      .from('customer_orders')
      .update({ motoboy_id: motoboyId, delivery_token: token, status: 'out_for_delivery' } as any)
      .eq('id', orderId);

    if (error) {
      toast.error('Erro ao atribuir motoboy');
      return;
    }

    // Build items text
    const itemsText = (order.items || [])
      .map(i => `*${i.quantity}x* ${i.product_name}${i.mixer ? ` + ${i.mixer}` : ''} - R$ ${i.total.toFixed(2)}`)
      .join('\n');

    // Send WhatsApp to motoboy
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
    } catch (e) {
      console.error('WhatsApp send error:', e);
      toast.success('Motoboy atribuído (erro ao enviar WhatsApp)');
    }

    // Also notify customer
    sendWhatsAppNotification(order, 'out_for_delivery');

    setAssigningMotoboy(null);
    queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
  };

  const startEditing = (order: CustomerOrder) => {
    setEditingOrder(order.id);
    setEditForm({
      customer_name: order.customer_name,
      customer_phone: order.customer_phone || '',
      customer_address: order.customer_address || '',
      notes: order.notes || '',
    });
  };

  const cancelEditing = () => {
    setEditingOrder(null);
  };

  const saveEdit = async (orderId: string) => {
    const { error } = await supabase
      .from('customer_orders')
      .update({
        customer_name: editForm.customer_name.trim(),
        customer_phone: editForm.customer_phone.trim() || null,
        customer_address: editForm.customer_address.trim() || null,
        notes: editForm.notes.trim() || null,
      } as any)
      .eq('id', orderId);

    if (error) {
      toast.error('Erro ao salvar alterações');
      return;
    }
    toast.success('Pedido atualizado!');
    setEditingOrder(null);
    queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
  };

  const handleDelete = async (orderId: string) => {
    // Delete items first, then order
    const { error: itemsError } = await supabase
      .from('customer_order_items')
      .delete()
      .eq('order_id', orderId);
    if (itemsError) {
      toast.error('Erro ao apagar itens do pedido');
      return;
    }

    const { error } = await supabase
      .from('customer_orders')
      .delete()
      .eq('id', orderId);
    if (error) {
      toast.error('Erro ao apagar pedido');
      return;
    }
    toast.success('Pedido apagado!');
    setDeletingOrder(null);
    setExpandedOrder(null);
    queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
  };

  if (isLoading) {
    return <p className="text-muted-foreground text-center py-8">Carregando pedidos...</p>;
  }

  return (
    <div className="space-y-4">
      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2">
        <FilterPill active={filter === 'all'} onClick={() => setFilter('all')} label="Todos" count={orders.length} />
        {(Object.keys(STATUS_CONFIG) as CustomerOrder['status'][]).map(s => (
          <FilterPill
            key={s}
            active={filter === s}
            onClick={() => setFilter(s)}
            label={STATUS_CONFIG[s].label}
            count={activeCount(s)}
            colorClass={STATUS_CONFIG[s].color}
          />
        ))}
      </div>

      {/* Orders list */}
      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">Nenhum pedido encontrado.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => {
            const config = STATUS_CONFIG[order.status];
            const StatusIcon = config.icon;
            const isExpanded = expandedOrder === order.id;
            const isEditing = editingOrder === order.id;
            const isDeleting = deletingOrder === order.id;
            const nextStatus = getNextStatus(order.status);

            return (
              <div
                key={order.id}
                className={`rounded-lg border ${config.bg} overflow-hidden transition-all`}
              >
                {/* Header */}
                <button
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <StatusIcon className={`h-5 w-5 flex-shrink-0 ${config.color}`} />
                    <div className="min-w-0">
                      <p className="font-medium text-card-foreground truncate">
                        {order.customer_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        {' · '}{order.items?.length ?? 0} item(ns)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="font-display text-lg text-primary">{fmt(order.total)}</span>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">
                    {/* Customer info - view or edit mode */}
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          value={editForm.customer_name}
                          onChange={e => setEditForm(f => ({ ...f, customer_name: e.target.value }))}
                          placeholder="Nome do cliente"
                          className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm"
                        />
                        <input
                          value={editForm.customer_phone}
                          onChange={e => setEditForm(f => ({ ...f, customer_phone: e.target.value }))}
                          placeholder="Telefone"
                          className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm"
                        />
                        <input
                          value={editForm.customer_address}
                          onChange={e => setEditForm(f => ({ ...f, customer_address: e.target.value }))}
                          placeholder="Endereço"
                          className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm"
                        />
                        <textarea
                          value={editForm.notes}
                          onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                          placeholder="Observações"
                          rows={2}
                          className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveEdit(order.id)}
                            className="flex items-center gap-1 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-sm font-medium hover:opacity-90"
                          >
                            <Save className="h-3.5 w-3.5" /> Salvar
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="flex items-center gap-1 border border-border text-muted-foreground px-3 py-1.5 rounded-lg text-sm hover:bg-muted"
                          >
                            <X className="h-3.5 w-3.5" /> Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-4 text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <User className="h-3.5 w-3.5" /> {order.customer_name}
                        </span>
                        {order.customer_phone && (
                          <a href={`tel:${order.customer_phone}`} className="flex items-center gap-1 text-primary hover:underline">
                            <Phone className="h-3.5 w-3.5" /> {order.customer_phone}
                          </a>
                        )}
                        {order.customer_address && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" /> {order.customer_address}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Items */}
                    <div className="bg-background/50 rounded-lg p-3">
                      {order.items?.map(item => (
                        <div key={item.id} className="flex justify-between py-1 text-sm">
                          <span className="text-card-foreground">
                            {item.quantity}x {item.product_name}
                            {item.mixer && <span className="text-muted-foreground"> + {item.mixer}</span>}
                          </span>
                          <span className="text-primary font-medium">{fmt(item.total)}</span>
                        </div>
                      ))}
                      {order.delivery_fee > 0 && (
                        <div className="flex justify-between py-1 text-sm border-t border-border/50 mt-1 pt-1">
                          <span className="text-muted-foreground">Taxa de entrega</span>
                          <span className="text-muted-foreground">{fmt(order.delivery_fee)}</span>
                        </div>
                      )}
                    </div>

                    {order.notes && !isEditing && (
                      <p className="text-xs text-muted-foreground italic">📝 {order.notes}</p>
                    )}

                    {/* Status actions + edit/delete */}
                    <div className="flex flex-wrap gap-2">
                      {nextStatus && (
                        <button
                          onClick={() => handleStatusChange(order.id, nextStatus)}
                          disabled={updateStatus.isPending}
                          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-colors disabled:opacity-50"
                        >
                          Avançar → {STATUS_CONFIG[nextStatus].label}
                        </button>
                      )}
                      {order.status !== 'cancelled' && order.status !== 'delivered' && (
                        <button
                          onClick={() => handleStatusChange(order.id, 'cancelled')}
                          disabled={updateStatus.isPending}
                          className="border border-destructive/50 text-destructive px-4 py-2 rounded-lg text-sm font-medium hover:bg-destructive/10 transition-colors disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                      )}

                      {!isEditing && (
                        <button
                          onClick={() => startEditing(order)}
                          className="flex items-center gap-1 border border-border text-muted-foreground px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Editar
                        </button>
                      )}

                      {isDeleting ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-destructive font-medium">Apagar?</span>
                          <button
                            onClick={() => handleDelete(order.id)}
                            className="bg-destructive text-destructive-foreground px-3 py-2 rounded-lg text-sm font-medium hover:opacity-90"
                          >
                            Sim
                          </button>
                          <button
                            onClick={() => setDeletingOrder(null)}
                            className="border border-border text-muted-foreground px-3 py-2 rounded-lg text-sm hover:bg-muted"
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeletingOrder(order.id)}
                          className="flex items-center gap-1 border border-destructive/30 text-destructive px-3 py-2 rounded-lg text-sm hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Apagar
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const FilterPill = ({
  active, onClick, label, count, colorClass,
}: {
  active: boolean; onClick: () => void; label: string; count: number; colorClass?: string;
}) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
      active
        ? 'bg-primary text-primary-foreground'
        : 'bg-muted text-muted-foreground hover:bg-muted/80'
    }`}
  >
    {label} <span className={`ml-1 ${active ? '' : colorClass || ''}`}>({count})</span>
  </button>
);

export default OrderManager;
