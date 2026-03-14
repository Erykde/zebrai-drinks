import { DbProduct } from '@/hooks/useProducts';

interface ProductListItemProps {
  product: DbProduct;
  onClick: () => void;
}

const ProductListItem = ({ product, onClick }: ProductListItemProps) => {
  const hasMixers = product.mixer_options.length > 0;

  const minPrice = hasMixers
    ? Math.min(...product.mixer_options.map(m => m.price))
    : product.is_promotion && product.promotion_price ? product.promotion_price : product.price;

  return (
    <button
      onClick={onClick}
      className="w-full flex gap-3 p-3 text-left hover:bg-muted/30 transition-colors"
    >
      {/* Image */}
      <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted shrink-0 flex items-center justify-center">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-4xl">{product.image_emoji ?? '🍹'}</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 flex flex-col justify-between py-0.5">
        <div>
          <div className="flex items-start gap-1">
            <h3 className="font-semibold text-sm text-card-foreground leading-tight flex-1">{product.name}</h3>
            {product.is_promotion && (
              <span className="bg-destructive text-destructive-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                🔥 PROMO
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-snug">{product.description}</p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          {hasMixers && (
            <span className="text-xs text-muted-foreground">A partir de</span>
          )}
          <span className="font-bold text-base text-primary">R$ {minPrice.toFixed(2)}</span>
        </div>
      </div>
    </button>
  );
};

export default ProductListItem;
