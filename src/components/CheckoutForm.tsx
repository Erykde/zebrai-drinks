import { useState } from 'react';
import { useStore } from '@/contexts/StoreContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Order } from '@/data/products';
import { useDeliveryZones, DeliveryZone } from '@/hooks/useDeliveryZones';
import { MapPin, Truck } from 'lucide-react';

const CheckoutForm = () => {
  const { cart, cartTotal, addOrder } = useStore();
  const navigate = useNavigate();
  const { data: zones = [], isLoading: zonesLoading } = useDeliveryZones();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card' | 'cash'>('pix');
  const [cashAmount, setCashAmount] = useState('');
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null);

  const deliveryFee = deliveryType === 'delivery' && selectedZone ? selectedZone.fee : 0;
  const orderTotal = cartTotal + deliveryFee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !phone.trim()) {
      toast.error('Preencha nome e telefone!');
      return;
    }
    if (deliveryType === 'delivery' && !address.trim()) {
      toast.error('Preencha o endereço para delivery!');
      return;
    }
    if (deliveryType === 'delivery' && !selectedZone) {
      toast.error('Selecione sua região de entrega!');
      return;
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

    // Build WhatsApp message
    const itemsList = cart.map(i => {
      const price = i.finalPrice ?? i.product.price;
      const itemName = i.selectedMixer ? `${i.product.name} + ${i.selectedMixer}` : i.product.name;
      return `• ${i.quantity}x ${itemName} - R$${(price * i.quantity).toFixed(2)}`;
    }).join('\n');
    const paymentLabels = { pix: 'PIX', card: 'Cartão', cash: 'Dinheiro' };
    let msg = `🦓 *NOVO PEDIDO - ZEBRAI DRINKS*\n\n`;
    msg += `👤 *Cliente:* ${name}\n📱 *Tel:* ${phone}\n`;
    msg += deliveryType === 'delivery' ? `📍 *Endereço:* ${address}\n` : `🏪 *Retirada no local*\n`;
    if (deliveryType === 'delivery' && selectedZone) {
      msg += `🚚 *Região:* ${selectedZone.zone_name}\n`;
    }
    msg += `\n🍹 *Itens:*\n${itemsList}\n`;
    if (deliveryFee > 0) {
      msg += `\n🏍️ *Taxa de entrega:* R$ ${deliveryFee.toFixed(2)}`;
      msg += `\n📦 *Subtotal produtos:* R$ ${cartTotal.toFixed(2)}`;
    }
    msg += `\n💰 *Total: R$ ${orderTotal.toFixed(2)}*\n`;
    msg += `💳 *Pagamento:* ${paymentLabels[paymentMethod]}`;
    if (paymentMethod === 'pix') {
      msg += `\n\n📲 *Dados PIX:*`;
      msg += `\n• Chave (Telefone): (41) 99842-9633`;
      msg += `\n• Nome: Eryk de Paula`;
    }
    if (paymentMethod === 'cash' && order.cashChange !== undefined && order.cashChange > 0) {
      msg += `\n💵 *Troco para:* R$ ${parseFloat(cashAmount).toFixed(2)} (troco: R$ ${order.cashChange.toFixed(2)})`;
    }

    const whatsappNumber = '5541984296633';
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`;
    window.open(whatsappUrl, '_blank');

    toast.success('Pedido enviado com sucesso! 🎉');
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
            onClick={() => { setDeliveryType('pickup'); setSelectedZone(null); }}
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

          {/* Delivery zone selector */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <MapPin className="h-4 w-4 inline mr-1" />
              Região de entrega (taxa)
            </label>
            {zonesLoading ? (
              <p className="text-sm text-muted-foreground">Carregando regiões...</p>
            ) : (
              <div className="space-y-2">
                {zones.map(zone => (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => setSelectedZone(zone)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all text-left ${
                      selectedZone?.id === zone.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Truck className={`h-4 w-4 ${selectedZone?.id === zone.id ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className={`text-sm font-medium ${selectedZone?.id === zone.id ? 'text-primary' : 'text-foreground'}`}>
                        {zone.zone_name}
                      </span>
                    </div>
                    <span className={`text-sm font-bold ${zone.fee === 0 ? 'text-green-500' : 'text-primary'}`}>
                      {zone.fee === 0 ? 'Grátis' : `R$ ${zone.fee.toFixed(2)}`}
                    </span>
                  </button>
                ))}
              </div>
            )}
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
        {deliveryFee > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">🏍️ Taxa de entrega</span>
            <span className="text-foreground">R$ {deliveryFee.toFixed(2)}</span>
          </div>
        )}
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
        Enviar Pedido via WhatsApp 📱
      </button>
    </form>
  );
};

export default CheckoutForm;
