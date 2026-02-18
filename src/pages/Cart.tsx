import { useState } from 'react';
import { Minus, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';
import Header from '@/components/Header';
import CheckoutForm from '@/components/CheckoutForm';

const Cart = () => {
  const { cart, updateCartQuantity, removeFromCart, cartTotal } = useStore();
  const [showCheckout, setShowCheckout] = useState(false);

  if (cart.length === 0 && !showCheckout) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <span className="text-6xl mb-6 block">🛒</span>
          <h2 className="font-display text-3xl mb-4 text-foreground">CARRINHO VAZIO</h2>
          <p className="text-muted-foreground mb-6">Adicione bebidas do nosso cardápio!</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-gold-dark transition-colors shadow-gold"
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
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
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
        <h2 className="font-display text-3xl mb-6 text-foreground">SEU CARRINHO</h2>

        <div className="space-y-3">
          {cart.map(item => (
            <div key={item.product.id} className="bg-card rounded-lg border border-border p-4 flex items-center gap-4">
              <span className="text-3xl">{item.product.image}</span>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-card-foreground truncate">{item.product.name}</h3>
                <p className="text-sm text-primary font-bold">R$ {item.product.price.toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                  className="p-1 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center font-medium">{item.quantity}</span>
                <button
                  onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                  className="p-1 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  onClick={() => removeFromCart(item.product.id)}
                  className="p-1 rounded-full text-destructive hover:bg-destructive/10 transition-colors ml-2"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 bg-card rounded-lg border border-border p-4">
          <div className="flex justify-between items-center text-lg">
            <span className="font-medium text-card-foreground">Total</span>
            <span className="font-display text-2xl text-primary">R$ {cartTotal.toFixed(2)}</span>
          </div>
          <button
            onClick={() => setShowCheckout(true)}
            className="mt-4 w-full bg-primary text-primary-foreground py-3 rounded-lg font-bold text-lg hover:bg-gold-dark transition-colors shadow-gold"
          >
            Finalizar Pedido
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
