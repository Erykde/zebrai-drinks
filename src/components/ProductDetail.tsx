import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Minus } from 'lucide-react';
import { DbProduct } from '@/hooks/useProducts';
import { useStore } from '@/contexts/StoreContext';
import { toast } from 'sonner';
import Header from '@/components/Header';

interface ProductDetailProps {
  product: DbProduct;
  onBack: () => void;
}

const ProductDetail = ({ product, onBack }: ProductDetailProps) => {
  const { addToCart } = useStore();
  const [selectedMixer, setSelectedMixer] = useState<string | null>(
    product.mixer_options.length > 0 ? product.mixer_options[0].mixer : null
  );
  const [quantity, setQuantity] = useState(1);

  const hasMixers = product.mixer_options.length > 0;
  const currentPrice = hasMixers
    ? product.mixer_options.find(m => m.mixer === selectedMixer)?.price ?? product.price
    : product.is_promotion && product.promotion_price
      ? product.promotion_price
      : product.price;

  const handleAddToCart = () => {
    // Convert DbProduct to the format expected by StoreContext
    const cartProduct = {
      id: product.id,
      name: product.name,
      description: product.description ?? '',
      price: currentPrice,
      costPrice: 0,
      category: product.category,
      image: product.image_emoji ?? '🍹',
      stock: product.stock ?? 99,
      sold: 0,
    };

    for (let i = 0; i < quantity; i++) {
      addToCart(cartProduct, selectedMixer ?? undefined, currentPrice);
    }

    const mixerLabel = selectedMixer ? ` + ${selectedMixer}` : '';
    toast.success(`${quantity}x ${product.name}${mixerLabel} adicionado!`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6 max-w-lg">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>

        <div className="bg-card rounded-xl border border-border p-6 animate-fade-in">
          {/* Emoji & promotion badge */}
          <div className="relative text-center mb-4">
            <span className="text-8xl">{product.image_emoji ?? '🍹'}</span>
            {product.is_promotion && (
              <span className="absolute top-0 right-0 bg-destructive text-destructive-foreground text-xs font-bold px-3 py-1 rounded-full">
                🔥 PROMOÇÃO
              </span>
            )}
          </div>

          <h1 className="font-display text-3xl text-card-foreground mb-2">{product.name}</h1>
          <p className="text-muted-foreground mb-4">{product.description}</p>
          <p className="text-sm text-muted-foreground/70 mb-4">{product.category}</p>

          {/* Price */}
          <div className="mb-6">
            {product.is_promotion && product.promotion_price && !hasMixers ? (
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground line-through text-lg">R$ {product.price.toFixed(2)}</span>
                <span className="font-bold text-2xl text-destructive">R$ {product.promotion_price.toFixed(2)}</span>
              </div>
            ) : (
              <span className="font-bold text-2xl text-primary">R$ {currentPrice.toFixed(2)}</span>
            )}
          </div>

          {/* Mixer selection */}
          {hasMixers && (
            <div className="mb-6">
              <p className="text-sm font-medium text-foreground mb-3">Escolha o acompanhamento:</p>
              <div className="flex flex-col gap-2">
                {product.mixer_options.map((option) => (
                  <button
                    key={option.mixer}
                    onClick={() => setSelectedMixer(option.mixer)}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all text-left ${
                      selectedMixer === option.mixer
                        ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <span className="font-medium text-card-foreground">{option.mixer}</span>
                    <span className="font-bold text-primary">R$ {option.price.toFixed(2)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <button
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
            >
              <Minus className="h-5 w-5" />
            </button>
            <span className="text-2xl font-bold w-12 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity(q => q + 1)}
              className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          {/* Add to cart */}
          <button
            onClick={handleAddToCart}
            className="w-full bg-primary text-primary-foreground py-4 rounded-lg font-bold text-lg hover:bg-gold-dark transition-colors shadow-gold"
          >
            Adicionar R$ {(currentPrice * quantity).toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
