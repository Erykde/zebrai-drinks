import { useState } from 'react';
import { Minus, Plus, Trash2, ArrowLeft, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import Header from '@/components/Header';
import CheckoutForm from '@/components/CheckoutForm';

const Cart = () => {
  const { cart, updateCartQuantity, removeFromCart, cartTotal } = useStore();
  const { data: siteSettings } = useSiteSettings();
  const [showCheckout, setShowCheckout] = useState(false);

  const cartTitle = siteSettings?.cart_title || 'SEU CARRINHO';
  const cartEmptyTitle = siteSettings?.cart_empty_title || 'CARRINHO VAZIO';
  const cartEmptySubtitle = siteSettings?.cart_empty_subtitle || 'Adicione bebidas do nosso cardápio!';
  const cartButtonText = siteSettings?.cart_button_text || 'Finalizar Pedido →';

  if (cart.length === 0 && !showCheckout) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-muted mb-6">
            <ShoppingCart className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="font-display text-4xl mb-3 text-foreground">{cartEmptyTitle}</h2>
          <p className="text-muted-foreground mb-8">{cartEmptySubtitle}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-gradient-gold text-primary-foreground px-8 py-3.5 rounded-2xl font-bold text-sm hover:opacity-90 transition-all shadow-gold active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" /> Ver Cardápio
          </Link>
        </div>
      </div>
    );
  }

  if (showCheckout) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-lg">
          <button
            onClick={() => setShowCheckout(false)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors text-sm"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar ao carrinho
          </button>
          <CheckoutForm />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-gold mb-3">
            <ShoppingCart className="h-7 w-7 text-primary-foreground" />
          </div>
          <h2 className="font-display text-4xl text-foreground tracking-wider">{cartTitle}</h2>
          <p className="text-sm text-muted-foreground mt-1">{cart.length} item(ns)</p>
        </div>

        <div className="space-y-3">
          {cart.map(item => {
            const cartKey = item.selectedMixer ? `${item.product.id}-${item.selectedMixer}` : item.product.id;
            const displayPrice = item.finalPrice ?? item.product.price;
            return (
              <div key={cartKey} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-4 transition-all hover:shadow-md">
                <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center text-3xl flex-shrink-0">
                  {item.product.image}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-card-foreground truncate text-sm">
                    {item.product.name}{item.selectedMixer ? ` + ${item.selectedMixer}` : ''}
                  </h3>
                  <p className="text-sm text-primary font-bold mt-0.5">R$ {displayPrice.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateCartQuantity(cartKey, item.quantity - 1)}
                    className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 transition-colors flex items-center justify-center"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                  <button
                    onClick={() => updateCartQuantity(cartKey, item.quantity + 1)}
                    className="w-8 h-8 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-colors flex items-center justify-center"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => removeFromCart(cartKey)}
                    className="w-8 h-8 rounded-full text-destructive hover:bg-destructive/10 transition-colors flex items-center justify-center ml-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 bg-gradient-dark rounded-2xl p-5 text-zebra-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs uppercase tracking-wider opacity-60">Total do carrinho</p>
              <p className="font-display text-4xl text-primary mt-1">R$ {cartTotal.toFixed(2)}</p>
            </div>
            <div className="text-right text-xs opacity-60">
              {cart.length} item(ns)
            </div>
          </div>
          <button
            onClick={() => setShowCheckout(true)}
            className="mt-5 w-full bg-gradient-gold text-primary-foreground py-4 rounded-2xl font-bold text-lg hover:opacity-90 transition-all shadow-gold active:scale-[0.98]"
          >
            {cartButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
