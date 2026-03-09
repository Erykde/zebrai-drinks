import { DbProduct } from '@/hooks/useProducts';

interface ProductCardProps {
  product: DbProduct;
  onClick: () => void;
}

const ProductCard = ({ product, onClick }: ProductCardProps) => {
  const hasMixers = product.mixer_options.length > 0;

  const minPrice = hasMixers
    ? Math.min(...product.mixer_options.map(m => m.price))
    : product.is_promotion && product.promotion_price ? product.promotion_price : product.price;

  return (
    <button
      onClick={onClick}
      className="w-full flex flex-col bg-card rounded-xl border border-border overflow-hidden text-left hover:border-primary/50 transition-all relative"
    >
      {product.is_promotion && (
        <span className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full z-10">
          🔥 PROMO
        </span>
      )}

      {/* Image */}
      <div className="w-full aspect-square overflow-hidden bg-muted flex items-center justify-center">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-6xl">{product.image_emoji ?? '🍹'}</span>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-1">
          <h3 className="font-semibold text-sm text-card-foreground leading-tight">{product.name}</h3>
          <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
            R$ {minPrice.toFixed(2)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-snug">{product.description}</p>
      </div>
    </button>
  );
};

export default ProductCard;
