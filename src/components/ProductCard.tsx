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
      className="w-full flex items-start gap-4 p-4 text-left hover:bg-muted/30 transition-colors relative"
    >
      {product.is_promotion && (
        <span className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full z-10">
          🔥 PROMO
        </span>
      )}

      {/* Image */}
      <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted shrink-0">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl bg-muted">
            {product.image_emoji ?? '🍹'}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 py-0.5">
        <h3 className="font-semibold text-base text-card-foreground leading-tight">{product.name}</h3>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2 leading-snug">{product.description}</p>
        <div className="mt-2 flex items-baseline gap-2">
          {hasMixers && (
            <span className="text-xs text-muted-foreground">A partir de</span>
          )}
          {product.is_promotion && product.promotion_price && !hasMixers ? (
            <>
              <span className="text-xs text-muted-foreground line-through">R$ {product.price.toFixed(2)}</span>
              <span className="font-bold text-lg text-primary">R$ {product.promotion_price.toFixed(2)}</span>
            </>
          ) : (
            <span className="font-bold text-lg text-primary">R$ {minPrice.toFixed(2)}</span>
          )}
        </div>
      </div>
    </button>
  );
};

export default ProductCard;
