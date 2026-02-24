import { useState } from 'react';
import { useStore } from '@/contexts/StoreContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Order } from '@/data/products';
import { createCustomerOrder } from '@/hooks/useCustomerOrders';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { Ticket, X } from 'lucide-react';

const checkoutSchema = z.object({
  name: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome muito longo'),
  phone: z.string().trim().min(10, 'Telefone deve ter pelo menos 10 dígitos').max(20, 'Telefone inválido')
    .regex(/^[\d\s()+-]+$/, 'Telefone deve conter apenas números'),
  address: z.string().trim().max(200, 'Endereço muito longo').optional(),
});

interface AppliedCoupon {
  code: string;
  discount_type: string;
  discount_value: number;
  discountAmount: number;
}

const CheckoutForm = () => {
  const { cart, cartTotal, addOrder } = useStore();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card' | 'cash'>('pix');
  const [cardType, setCardType] = useState<'credit' | 'debit'>('credit');
  const [cashAmount, setCashAmount] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const discountAmount = appliedCoupon?.discountAmount ?? 0;
  const orderTotal = Math.max(0, cartTotal - discountAmount);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponCode.trim().toUpperCase())
      .eq('is_active', true)
      .single();

    setValidatingCoupon(false);
    if (error || !data) {
      toast.error('Cupom inválido ou expirado');
      return;
    }

    const coupon = data as any;
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      toast.error('Cupom expirado');
      return;
    }
    if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
      toast.error('Cupom esgotado');
      return;
    }
    if (cartTotal < coupon.min_order_value) {
      toast.error(`Pedido mínimo de R$ ${coupon.min_order_value.toFixed(2)} para este cupom`);
      return;
    }

    const disc = coupon.discount_type === 'percentage'
      ? cartTotal * (coupon.discount_value / 100)
      : coupon.discount_value;

    setAppliedCoupon({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      discountAmount: Math.min(disc, cartTotal),
    });
    toast.success(`Cupom ${coupon.code} aplicado!`);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = checkoutSchema.safeParse({
      name,
      phone,
      address: deliveryType === 'delivery' ? address : undefined,
    });

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    if (deliveryType === 'delivery' && (!address.trim() || address.trim().length < 5)) {
      toast.error('Preencha o endereço completo para delivery!');
      return;
    }

    let savedOrderId: string | null = null;
    try {
      const orderItems = cart.map(i => ({
        product_name: i.selectedMixer ? `${i.product.name} + ${i.selectedMixer}` : i.product.name,
        quantity: i.quantity,
        unit_price: i.finalPrice ?? i.product.price,
        mixer: i.selectedMixer || undefined,
        total: (i.finalPrice ?? i.product.price) * i.quantity,
      }));

      const result = await createCustomerOrder({
        customer_name: name.trim(),
        customer_phone: phone.trim(),
        customer_address: deliveryType === 'delivery' ? address.trim() : undefined,
        total: orderTotal,
        items: orderItems,
      });
      savedOrderId = result?.id ?? null;

      // Increment coupon used_count
      if (appliedCoupon && savedOrderId) {
        await supabase
          .from('coupons')
          .update({ used_count: undefined } as any) // we'll use rpc or raw increment
          .eq('code', appliedCoupon.code);
        // Simple increment via select + update
        const { data: couponData } = await supabase
          .from('coupons')
          .select('id, used_count')
          .eq('code', appliedCoupon.code)
          .single();
        if (couponData) {
          await supabase
            .from('coupons')
            .update({ used_count: (couponData as any).used_count + 1 } as any)
            .eq('id', (couponData as any).id);
        }
      }
    } catch (err) {
      console.error('Error saving order:', err);
    }

    const order: Order = {
      id: savedOrderId || Date.now().toString(),
      customerName: name.trim(),
      customerPhone: phone.trim(),
      customerAddress: deliveryType === 'delivery' ? address.trim() : undefined,
      deliveryType,
      paymentMethod,
      cashChange: paymentMethod === 'cash' && cashAmount ? parseFloat(cashAmount) - orderTotal : undefined,
      items: cart,
      total: orderTotal,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    addOrder(order);

    toast.success('Pedido enviado com sucesso! 🎉');
    if (savedOrderId) {
      navigate(`/pedido?id=${savedOrderId}`);
    } else {
      navigate('/');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
      <h2 className="font-display text-3xl text-foreground">FINALIZAR PEDIDO</h2>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Nome completo</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-input bg-card text-card-foreground focus:ring-2 focus:ring-ring outline-none"
          placeholder="Seu nome"
          required
          maxLength={100}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">WhatsApp / Telefone</label>
        <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-input bg-card text-card-foreground focus:ring-2 focus:ring-ring outline-none"
          placeholder="(99) 99999-9999"
          required
          maxLength={20}
        />
      </div>

      {/* Delivery type */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Tipo de entrega</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => { setDeliveryType('delivery'); }}
            className={`py-3 rounded-lg border text-sm font-medium transition-all ${
              deliveryType === 'delivery'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/50'
            }`}
          >
            🏍️ Delivery
          </button>
          <button
            type="button"
            onClick={() => { setDeliveryType('pickup'); }}
            className={`py-3 rounded-lg border text-sm font-medium transition-all ${
              deliveryType === 'pickup'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/50'
            }`}
          >
            🏪 Retirada
          </button>
        </div>
      </div>

      {deliveryType === 'delivery' && (
        <>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Endereço de entrega</label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-input bg-card text-card-foreground focus:ring-2 focus:ring-ring outline-none"
              placeholder="Rua, número, bairro..."
              required
              maxLength={200}
            />
          </div>

        </>
      )}

      {/* Payment */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Forma de pagamento</label>
        <div className="grid grid-cols-3 gap-3">
          {([['pix', '📲 PIX'], ['card', '💳 Cartão'], ['cash', '💵 Dinheiro']] as const).map(([method, label]) => (
            <button
              key={method}
              type="button"
              onClick={() => setPaymentMethod(method)}
              className={`py-3 rounded-lg border text-sm font-medium transition-all ${
                paymentMethod === method
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {paymentMethod === 'card' && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Tipo de cartão</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setCardType('credit')}
              className={`py-3 rounded-lg border text-sm font-medium transition-all ${
                cardType === 'credit'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/50'
              }`}
            >
              💳 Crédito
            </button>
            <button
              type="button"
              onClick={() => setCardType('debit')}
              className={`py-3 rounded-lg border text-sm font-medium transition-all ${
                cardType === 'debit'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/50'
              }`}
            >
              💳 Débito
            </button>
          </div>
        </div>
      )}

      {paymentMethod === 'cash' && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Troco para quanto?</label>
          <input
            type="number"
            value={cashAmount}
            onChange={e => setCashAmount(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-input bg-card text-card-foreground focus:ring-2 focus:ring-ring outline-none"
            placeholder={`Total: R$ ${orderTotal.toFixed(2)}`}
            min={orderTotal}
            step="0.01"
          />
          {cashAmount && parseFloat(cashAmount) > orderTotal && (
            <p className="text-sm text-primary mt-1">
              Troco: R$ {(parseFloat(cashAmount) - orderTotal).toFixed(2)}
            </p>
          )}
        </div>
      )}

      {/* Coupon */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          <Ticket className="h-4 w-4 inline mr-1" /> Cupom de desconto
        </label>
        {appliedCoupon ? (
          <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-lg px-4 py-3">
            <Ticket className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary flex-1">
              {appliedCoupon.code} — {appliedCoupon.discount_type === 'percentage' ? `${appliedCoupon.discount_value}%` : `R$ ${appliedCoupon.discount_value.toFixed(2)}`} off
            </span>
            <button type="button" onClick={removeCoupon} className="p-1 text-destructive hover:bg-destructive/10 rounded">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={e => setCouponCode(e.target.value)}
              placeholder="Digite o código"
              className="flex-1 px-4 py-3 rounded-lg border border-input bg-card text-card-foreground focus:ring-2 focus:ring-ring outline-none uppercase text-sm"
              maxLength={20}
            />
            <button
              type="button"
              onClick={applyCoupon}
              disabled={validatingCoupon || !couponCode.trim()}
              className="px-4 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {validatingCoupon ? '...' : 'Aplicar'}
            </button>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-muted rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Produtos</span>
          <span className="text-foreground">R$ {cartTotal.toFixed(2)}</span>
        </div>
        {appliedCoupon && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">🎟️ Desconto ({appliedCoupon.code})</span>
            <span className="text-green-600 font-medium">-R$ {discountAmount.toFixed(2)}</span>
          </div>
        )}
        {deliveryType === 'pickup' && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">🏪 Retirada no local</span>
            <span className="text-green-600 font-medium">Grátis</span>
          </div>
        )}
        <div className="border-t border-border pt-2 flex justify-between text-lg font-bold">
          <span className="text-foreground">Total</span>
          <span className="text-primary">R$ {orderTotal.toFixed(2)}</span>
        </div>
        <p className="text-xs text-muted-foreground">{cart.length} item(ns) no pedido</p>
      </div>

      <button
        type="submit"
        className="w-full bg-primary text-primary-foreground py-4 rounded-lg font-bold text-lg hover:opacity-90 transition-colors"
      >
        Enviar Pedido 🎉
      </button>
    </form>
  );
};

export default CheckoutForm;
