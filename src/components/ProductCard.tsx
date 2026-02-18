import { Plus } from 'lucide-react';
import { Product } from '@/data/products';
import { useStore } from '@/contexts/StoreContext';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart } = useStore();

  const handleAdd = () => {
    if (product.stock <= 0) {
      toast.error('Produto esgotado!');
      return;
    }
    addToCart(product);
    toast.success(`${product.name} adicionado!`);
  };

  return (
    <div className="group bg-card rounded-lg border border-border p-4 hover:shadow-gold transition-all duration-300 animate-fade-in">
      <div className="text-5xl text-center mb-3 group-hover:scale-110 transition-transform">
        {product.image}
      </div>
      <div className="space-y-1">
        <h3 className="font-display text-lg text-card-foreground">{product.name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
        <div className="flex items-center justify-between pt-2">
          <span className="font-bold text-xl text-primary">
            R$ {product.price.toFixed(2)}
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
  );
};

export default ProductCard;
