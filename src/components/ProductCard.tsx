import { Plus } from 'lucide-react';
import { DbProduct } from '@/hooks/useProducts';
import { useStore } from '@/contexts/StoreContext';
import { toast } from 'sonner';

interface ProductCardProps {
  product: DbProduct;
  onClick: () => void;
}

const ProductCard = ({ product, onClick }: ProductCardProps) => {
  const { addToCart } = useStore();
  const hasMixers = product.mixer_options.length > 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if ((product.stock ?? 99) <= 0) {
      toast.error('Produto esgotado!');
      return;
    }
    if (hasMixers) {
      onClick(); // open detail for mixer selection
      return;
    }
    const price = product.is_promotion && product.promotion_price ? product.promotion_price : product.price;
    const cartProduct = {
      id: product.id, name: product.name, description: product.description ?? '',
      price, costPrice: 0, category: product.category, image: product.image_emoji ?? '🍹',
      stock: product.stock ?? 99, sold: 0,
    };
    addToCart(cartProduct);
    toast.success(`${product.name} adicionado!`);
  };

  const minPrice = hasMixers
    ? Math.min(...product.mixer_options.map(m => m.price))
    : product.is_promotion && product.promotion_price ? product.promotion_price : product.price;

  return (
    <div
      onClick={onClick}
      className="group bg-card rounded-lg border border-border p-4 hover:shadow-gold transition-all duration-300 animate-fade-in cursor-pointer relative"
    >
      {product.is_promotion && (
        <span className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded-full z-10">
          🔥 PROMO
        </span>
      )}
      <div className="text-5xl text-center mb-3 group-hover:scale-110 transition-transform">
        {product.image_emoji ?? '🍹'}
      </div>
      <div className="space-y-1">
        <h3 className="font-display text-lg text-card-foreground">{product.name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
        <div className="flex items-center justify-between pt-2">
          <div>
            {product.is_promotion && product.promotion_price && !hasMixers ? (
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground line-through">R$ {product.price.toFixed(2)}</span>
                <span className="font-bold text-lg text-destructive">R$ {product.promotion_price.toFixed(2)}</span>
              </div>
            ) : (
              <span className="font-bold text-xl text-primary">
                {hasMixers ? `R$ ${minPrice.toFixed(2)}` : `R$ ${minPrice.toFixed(2)}`}
              </span>
            )}
          </div>
          <button
            onClick={handleQuickAdd}
            disabled={(product.stock ?? 99) <= 0}
            className="bg-primary text-primary-foreground p-2 rounded-full hover:bg-gold-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-gold"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
