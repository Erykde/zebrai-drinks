import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useStore } from '@/contexts/StoreContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Order } from '@/data/products';
import { createCustomerOrder } from '@/hooks/useCustomerOrders';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { Ticket, X, User, Phone, MapPin, CreditCard, Banknote, QrCode, ShoppingBag, Bike, Store } from 'lucide-react';

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

const CUSTOMER_STORAGE_KEY = 'zebrai-customer-data';

const loadSavedCustomer = () => {
  try {
    const saved = localStorage.getItem(CUSTOMER_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return { name: '', phone: '', address: '' };
};

const saveCustomerData = (name: string, phone: string, address: string) => {
  try {
    localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify({ name, phone, address }));
  } catch {}
};

const CheckoutForm = () => {
  const { cart, cartTotal, addOrder } = useStore();
  const navigate = useNavigate();
  const savedCustomer = loadSavedCustomer();
  const [name, setName] = useState(savedCustomer.name);
  const [phone, setPhone] = useState(savedCustomer.phone);
  const [address, setAddress] = useState(savedCustomer.address);
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card' | 'cash'>('pix');
  const [cardType, setCardType] = useState<'credit' | 'debit'>('credit');
  const [cashAmount, setCashAmount] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

    setSubmitting(true);
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

      if (appliedCoupon && savedOrderId) {
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
    setSubmitting(false);
    toast.success('Pedido enviado com sucesso! 🎉');
    if (savedOrderId) {
      navigate(`/pedido?id=${savedOrderId}`);
    } else {
      navigate('/');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in pb-6">
      {/* Title */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-gold mb-3">
          <ShoppingBag className="h-8 w-8 text-primary-foreground" />
        </div>
        <h2 className="font-display text-4xl text-foreground tracking-wider">FINALIZAR PEDIDO</h2>
        <p className="text-sm text-muted-foreground mt-1">{cart.length} item(ns) • R$ {cartTotal.toFixed(2)}</p>
      </div>

      {/* Items preview */}
      <div className="bg-card rounded-2xl border border-border p-4 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Seus itens</p>
        {cart.map((item, i) => {
          const displayPrice = item.finalPrice ?? item.product.price;
          return (
            <div key={i} className="flex items-center gap-3 py-1.5">
              <span className="text-2xl">{item.product.image}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-card-foreground truncate">
                  {item.product.name}{item.selectedMixer ? ` + ${item.selectedMixer}` : ''}
                </p>
                <p className="text-xs text-muted-foreground">{item.quantity}x R$ {displayPrice.toFixed(2)}</p>
              </div>
              <span className="text-sm font-bold text-primary">R$ {(displayPrice * item.quantity).toFixed(2)}</span>
            </div>
          );
        })}
      </div>

      {/* Personal Info */}
      <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <User className="h-3.5 w-3.5" /> Dados pessoais
        </p>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-background text-foreground focus:ring-2 focus:ring-ring outline-none text-sm"
            placeholder="Nome completo"
            required
            maxLength={100}
          />
        </div>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-background text-foreground focus:ring-2 focus:ring-ring outline-none text-sm"
            placeholder="(99) 99999-9999"
            required
            maxLength={20}
          />
        </div>
      </div>

      {/* Delivery type */}
      <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tipo de entrega</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setDeliveryType('delivery')}
            className={`flex flex-col items-center gap-2 py-4 rounded-xl border-2 text-sm font-medium transition-all ${
              deliveryType === 'delivery'
                ? 'border-primary bg-primary/10 text-primary shadow-gold'
                : 'border-border text-muted-foreground hover:border-primary/40'
            }`}
          >
            <Bike className="h-6 w-6" />
            Delivery
          </button>
          <button
            type="button"
            onClick={() => setDeliveryType('pickup')}
            className={`flex flex-col items-center gap-2 py-4 rounded-xl border-2 text-sm font-medium transition-all ${
              deliveryType === 'pickup'
                ? 'border-primary bg-primary/10 text-primary shadow-gold'
                : 'border-border text-muted-foreground hover:border-primary/40'
            }`}
          >
            <Store className="h-6 w-6" />
            Retirada
          </button>
        </div>

        {deliveryType === 'delivery' && (
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-background text-foreground focus:ring-2 focus:ring-ring outline-none text-sm"
              placeholder="Rua, número, bairro..."
              required
              maxLength={200}
            />
          </div>
        )}
      </div>

      {/* Payment */}
      <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pagamento</p>
        <div className="grid grid-cols-3 gap-2">
          {([
            ['pix', 'PIX', QrCode],
            ['card', 'Cartão', CreditCard],
            ['cash', 'Dinheiro', Banknote],
          ] as const).map(([method, label, Icon]) => (
            <button
              key={method}
              type="button"
              onClick={() => setPaymentMethod(method)}
              className={`flex flex-col items-center gap-2 py-3.5 rounded-xl border-2 text-xs font-medium transition-all ${
                paymentMethod === method
                  ? 'border-primary bg-primary/10 text-primary shadow-gold'
                  : 'border-border text-muted-foreground hover:border-primary/40'
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          ))}
        </div>

        {paymentMethod === 'pix' && (
          <div className="flex flex-col items-center gap-4 bg-background rounded-xl border border-border p-5">
            <div className="bg-white p-3 rounded-xl shadow-sm">
              <QRCodeSVG value="00020126580014br.gov.bcb.pix013641984296633520400005303986540505.005802BR5918Eryk de Paula6014Curitiba62070503***6304" size={180} />
            </div>
            <div className="text-center space-y-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Chave PIX</p>
              <div className="flex items-center gap-2 bg-muted rounded-lg px-4 py-2.5">
                <span className="text-sm font-mono font-semibold text-foreground select-all">41 98429-6633</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText('41984296633');
                    toast.success('Chave PIX copiada!');
                  }}
                  className="p-1.5 rounded-md hover:bg-primary/10 text-primary transition-colors"
                  title="Copiar chave"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Eryk de Paula</p>
            </div>
          </div>
        )}

        {paymentMethod === 'card' && (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setCardType('credit')}
              className={`py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                cardType === 'credit'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/40'
              }`}
            >
              Crédito
            </button>
            <button
              type="button"
              onClick={() => setCardType('debit')}
              className={`py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                cardType === 'debit'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/40'
              }`}
            >
              Débito
            </button>
          </div>
        )}

        {paymentMethod === 'cash' && (
          <div className="relative">
            <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="number"
              value={cashAmount}
              onChange={e => setCashAmount(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-background text-foreground focus:ring-2 focus:ring-ring outline-none text-sm"
              placeholder={`Troco para quanto? (Total: R$ ${orderTotal.toFixed(2)})`}
              min={orderTotal}
              step="0.01"
            />
            {cashAmount && parseFloat(cashAmount) > orderTotal && (
              <p className="text-xs text-primary mt-2 font-medium">
                💰 Troco: R$ {(parseFloat(cashAmount) - orderTotal).toFixed(2)}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Coupon */}
      <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Ticket className="h-3.5 w-3.5" /> Cupom de desconto
        </p>
        {appliedCoupon ? (
          <div className="flex items-center gap-3 bg-primary/10 border-2 border-primary/30 rounded-xl px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Ticket className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-primary">{appliedCoupon.code}</p>
              <p className="text-xs text-muted-foreground">
                {appliedCoupon.discount_type === 'percentage' ? `${appliedCoupon.discount_value}% off` : `R$ ${appliedCoupon.discount_value.toFixed(2)} off`}
              </p>
            </div>
            <button type="button" onClick={removeCoupon} className="p-2 text-destructive hover:bg-destructive/10 rounded-full transition-colors">
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
              className="flex-1 px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:ring-2 focus:ring-ring outline-none uppercase text-sm"
              maxLength={20}
            />
            <button
              type="button"
              onClick={applyCoupon}
              disabled={validatingCoupon || !couponCode.trim()}
              className="px-5 py-3 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 disabled:opacity-50 transition-colors"
            >
              {validatingCoupon ? '...' : 'Aplicar'}
            </button>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-gradient-dark rounded-2xl p-5 space-y-3 text-zebra-white">
        <p className="text-xs font-semibold uppercase tracking-wider opacity-60">Resumo do pedido</p>
        <div className="flex justify-between text-sm">
          <span className="opacity-70">Subtotal ({cart.length} itens)</span>
          <span>R$ {cartTotal.toFixed(2)}</span>
        </div>
        {appliedCoupon && (
          <div className="flex justify-between text-sm">
            <span className="opacity-70">🎟️ Desconto</span>
            <span className="text-green-400 font-medium">-R$ {discountAmount.toFixed(2)}</span>
          </div>
        )}
        {deliveryType === 'pickup' && (
          <div className="flex justify-between text-sm">
            <span className="opacity-70">🏪 Retirada</span>
            <span className="text-green-400 font-medium">Grátis</span>
          </div>
        )}
        <div className="border-t border-zebra-white/20 pt-3 flex justify-between items-center">
          <span className="font-medium">Total</span>
          <span className="font-display text-3xl text-primary">R$ {orderTotal.toFixed(2)}</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-gradient-gold text-primary-foreground py-4 rounded-2xl font-bold text-lg hover:opacity-90 transition-all shadow-gold disabled:opacity-50 active:scale-[0.98]"
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            Enviando...
          </span>
        ) : (
          'Enviar Pedido 🎉'
        )}
      </button>
    </form>
  );
};

export default CheckoutForm;
