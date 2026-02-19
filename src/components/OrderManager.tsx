import { useState } from 'react';
import { useCustomerOrders, CustomerOrder } from '@/hooks/useCustomerOrders';
import { Clock, ChefHat, Truck, CheckCircle, XCircle, Phone, MapPin, User, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

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
  const [filter, setFilter] = useState<CustomerOrder['status'] | 'all'>('all');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  const activeCount = (status: CustomerOrder['status']) => orders.filter(o => o.status === status).length;

  const handleStatusChange = (orderId: string, newStatus: CustomerOrder['status']) => {
    updateStatus.mutate(
      { orderId, status: newStatus },
      {
        onSuccess: () => toast.success(`Status atualizado para: ${STATUS_CONFIG[newStatus].label}`),
        onError: () => toast.error('Erro ao atualizar status'),
      }
    );
  };

  const getNextStatus = (current: CustomerOrder['status']): CustomerOrder['status'] | null => {
    const idx = STATUS_FLOW.indexOf(current);
    if (idx === -1 || idx === STATUS_FLOW.length - 1) return null;
    return STATUS_FLOW[idx + 1];
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
                    {/* Customer info */}
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

                    {order.notes && (
                      <p className="text-xs text-muted-foreground italic">📝 {order.notes}</p>
                    )}

                    {/* Status actions */}
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
