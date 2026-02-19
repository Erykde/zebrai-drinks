import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export interface CustomerOrder {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  customer_address: string | null;
  status: 'pending' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  notes: string | null;
  delivery_fee: number;
  total: number;
  created_at: string;
  updated_at: string;
  items?: CustomerOrderItem[];
}

export interface CustomerOrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  cost_price: number;
  mixer: string | null;
  total: number;
  created_at: string;
}

export const useCustomerOrders = () => {
  const queryClient = useQueryClient();

  // Realtime subscription for new orders
  useEffect(() => {
    const channel = supabase
      .channel('customer-orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'customer_orders' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const ordersQuery = useQuery({
    queryKey: ['customer-orders'],
    queryFn: async (): Promise<CustomerOrder[]> => {
      const { data: orders, error } = await supabase
        .from('customer_orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Fetch items for all orders
      const orderIds = (orders ?? []).map(o => o.id);
      if (orderIds.length === 0) return [];

      const { data: items, error: itemsError } = await supabase
        .from('customer_order_items')
        .select('*')
        .in('order_id', orderIds);
      if (itemsError) throw itemsError;

      return (orders ?? []).map(o => ({
        ...o,
        status: o.status as CustomerOrder['status'],
        items: (items ?? []).filter(i => i.order_id === o.id),
      }));
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: CustomerOrder['status'] }) => {
      const { error } = await supabase
        .from('customer_orders')
        .update({ status } as any)
        .eq('id', orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
    },
  });

  return { ...ordersQuery, updateStatus };
};

export const createCustomerOrder = async (order: {
  customer_name: string;
  customer_phone?: string;
  customer_address?: string;
  notes?: string;
  delivery_fee?: number;
  total: number;
  items: {
    product_id?: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    cost_price?: number;
    mixer?: string;
    total: number;
  }[];
}) => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const response = await fetch(`${supabaseUrl}/functions/v1/create-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': anonKey,
    },
    body: JSON.stringify({
      customer_name: order.customer_name,
      customer_phone: order.customer_phone || null,
      customer_address: order.customer_address || null,
      notes: order.notes || null,
      delivery_fee: order.delivery_fee ?? 0,
      total: order.total,
      items: order.items.map(item => ({
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        mixer: item.mixer || null,
        total: item.total,
      })),
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Erro ao criar pedido' }));
    throw new Error(err.error || 'Erro ao criar pedido');
  }

  return await response.json();
};
