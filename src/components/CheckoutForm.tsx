import { useState } from 'react';
import { useStore } from '@/contexts/StoreContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Order } from '@/data/products';
import { createCustomerOrder } from '@/hooks/useCustomerOrders';

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

  const orderTotal = cartTotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !phone.trim()) {
      toast.error('Preencha nome e telefone!');
      return;
    }
    if (deliveryType === 'delivery' && !address.trim()) {
      toast.error('Preencha o endereço para delivery!');
      return;
    }

    // Save to database
    try {
      const orderItems = cart.map(i => ({
        product_name: i.selectedMixer ? `${i.product.name} + ${i.selectedMixer}` : i.product.name,
        quantity: i.quantity,
        unit_price: i.finalPrice ?? i.product.price,
        cost_price: i.product.costPrice ?? 0,
        mixer: i.selectedMixer || undefined,
        total: (i.finalPrice ?? i.product.price) * i.quantity,
      }));

      await createCustomerOrder({
        customer_name: name.trim(),
        customer_phone: phone.trim(),
        customer_address: deliveryType === 'delivery' ? address.trim() : undefined,
        total: orderTotal,
        items: orderItems,
      });
    } catch (err) {
      console.error('Error saving order:', err);
    }

    const order: Order = {
      id: Date.now().toString(),
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

    toast.success('Pedido enviado com sucesso! 🎉 Aguarde a confirmação.');
    navigate('/');
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

      {/* Summary */}
      <div className="bg-muted rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Produtos</span>
          <span className="text-foreground">R$ {cartTotal.toFixed(2)}</span>
        </div>
        {deliveryType === 'pickup' && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">🏪 Retirada no local</span>
            <span className="text-green-500 font-medium">Grátis</span>
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
