import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Product } from '@/data/products';
import { useStore } from '@/contexts/StoreContext';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart } = useStore();
  const [showMixerDialog, setShowMixerDialog] = useState(false);

  const hasMixers = product.mixerOptions && product.mixerOptions.length > 0;

  const handleAdd = () => {
    if (product.stock <= 0) {
      toast.error('Produto esgotado!');
      return;
    }
    if (hasMixers) {
      setShowMixerDialog(true);
    } else {
      addToCart(product);
      toast.success(`${product.name} adicionado!`);
    }
  };

  const handleSelectMixer = (mixer: string, price: number) => {
    addToCart(product, mixer, price);
    toast.success(`${product.name} + ${mixer} adicionado!`);
    setShowMixerDialog(false);
  };

  const minPrice = hasMixers
    ? Math.min(...product.mixerOptions!.map(m => m.price))
    : product.price;

  return (
    <>
      <div className="group bg-card rounded-lg border border-border p-4 hover:shadow-gold transition-all duration-300 animate-fade-in">
        <div className="text-5xl text-center mb-3 group-hover:scale-110 transition-transform">
          {product.image}
        </div>
        <div className="space-y-1">
          <h3 className="font-display text-lg text-card-foreground">{product.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
          <div className="flex items-center justify-between pt-2">
            <span className="font-bold text-xl text-primary">
              {hasMixers ? `a partir de R$ ${minPrice.toFixed(2)}` : `R$ ${product.price.toFixed(2)}`}
            </span>
            <button
              onClick={handleAdd}
              disabled={product.stock <= 0}
              className="bg-primary text-primary-foreground p-2 rounded-full hover:bg-gold-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-gold"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
          {product.stock <= 5 && product.stock > 0 && (
            <p className="text-xs text-accent font-medium">Últimas {product.stock} unidades!</p>
          )}
          {product.stock <= 0 && (
            <p className="text-xs text-destructive font-medium">Esgotado</p>
          )}
        </div>
      </div>

      {hasMixers && (
        <Dialog open={showMixerDialog} onOpenChange={setShowMixerDialog}>
          <DialogContent className="bg-card border-border max-w-sm">
            <DialogHeader>
              <DialogTitle className="font-display text-xl text-card-foreground">
                {product.image} {product.name}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">{product.description}</p>
            </DialogHeader>
            <p className="text-sm font-medium text-foreground">Escolha o acompanhamento:</p>
            <div className="flex flex-col gap-2">
              {product.mixerOptions!.map((option) => (
                <button
                  key={option.mixer}
                  onClick={() => handleSelectMixer(option.mixer, option.price)}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/10 transition-all text-left"
                >
                  <span className="font-medium text-card-foreground">{option.mixer}</span>
                  <span className="font-bold text-primary">R$ {option.price.toFixed(2)}</span>
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default ProductCard;
