import { useState, useMemo } from 'react';
import { ArrowLeft, Plus, Minus, ChevronDown, ChevronUp } from 'lucide-react';
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
  // Selection per group: { "Energéticos": { mixer: "Bally", flavor: "Tropical" }, "Gelo Saborizado": { mixer: "Gelo Saborizado", flavor: "Morango" } }
  const [selections, setSelections] = useState<Record<string, { mixer: string; flavor: string | null }>>({});
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const hasMixers = product.mixer_options.length > 0;

  // Group mixer options by group field
  const grouped = useMemo(() => {
    const groups: Record<string, typeof product.mixer_options> = {};
    for (const opt of product.mixer_options) {
      const g = opt.group || 'Outros';
      if (!groups[g]) groups[g] = [];
      groups[g].push(opt);
    }
    return groups;
  }, [product.mixer_options]);

  const groupNames = Object.keys(grouped);

  // Calculate total price: base product price + sum of selected mixer prices
  const selectedMixerPrices = useMemo(() => {
    let total = 0;
    for (const groupName of groupNames) {
      const sel = selections[groupName];
      if (sel) {
        const opt = product.mixer_options.find(m => m.mixer === sel.mixer);
        if (opt) total = Math.max(total, opt.price); // Use highest price among selections
      }
    }
    return total;
  }, [selections, groupNames, product.mixer_options]);

  // For products with mixers, use the energético price (highest selected) as the product price
  const currentPrice = hasMixers
    ? selectedMixerPrices || product.price
    : product.is_promotion && product.promotion_price
      ? product.promotion_price
      : product.price;

  // Can add if all groups have a selection (and flavor if required)
  const canAdd = !hasMixers || groupNames.every(g => {
    const sel = selections[g];
    if (!sel) return false;
    const opt = product.mixer_options.find(m => m.mixer === sel.mixer);
    if (opt?.flavors && opt.flavors.length > 0 && !sel.flavor) return false;
    return true;
  });

  const handleSelectMixer = (groupName: string, mixer: string) => {
    setSelections(prev => ({
      ...prev,
      [groupName]: { mixer, flavor: null },
    }));
  };

  const handleSelectFlavor = (groupName: string, flavor: string) => {
    setSelections(prev => ({
      ...prev,
      [groupName]: { ...prev[groupName], flavor },
    }));
  };

  const handleAddToCart = () => {
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

    // Build mixer label with all selections: "Bally - Tropical + Gelo Saborizado - Morango"
    const mixerParts: string[] = [];
    for (const groupName of groupNames) {
      const sel = selections[groupName];
      if (sel) {
        mixerParts.push(sel.flavor ? `${sel.mixer} (${sel.flavor})` : sel.mixer);
      }
    }
    const mixerLabel = mixerParts.length > 0 ? mixerParts.join(' + ') : undefined;

    for (let i = 0; i < quantity; i++) {
      addToCart(cartProduct, mixerLabel, currentPrice);
    }

    toast.success(`${quantity}x ${product.name}${mixerLabel ? ` + ${mixerLabel}` : ''} adicionado!`);
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
          {/* Product image or emoji */}
          <div className="relative mb-4">
            {product.image_url ? (
              <div className="w-full aspect-square max-h-64 rounded-xl overflow-hidden bg-muted">
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="text-center">
                <span className="text-8xl">{product.image_emoji ?? '🍹'}</span>
              </div>
            )}
            {product.is_promotion && (
              <span className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-xs font-bold px-3 py-1 rounded-full">
                🔥 PROMOÇÃO
              </span>
            )}
          </div>

          <h1 className="font-display text-3xl text-card-foreground mb-2">{product.name}</h1>
          {product.description && (
            <p className="text-muted-foreground mb-2">{product.description}</p>
          )}
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

          {/* Mixer selection - one per group */}
          {hasMixers && (
            <div className="mb-6 space-y-3">
              <p className="text-sm font-medium text-foreground">Monte seu pedido:</p>
              {groupNames.map(groupName => {
                const sel = selections[groupName];
                const isExpanded = expandedGroup === groupName;
                const hasSelection = !!sel;

                return (
                  <div key={groupName} className="border border-border rounded-xl overflow-hidden">
                    {/* Group header */}
                    <button
                      type="button"
                      onClick={() => setExpandedGroup(prev => prev === groupName ? null : groupName)}
                      className="w-full flex items-center justify-between p-3.5 bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">
                          {groupName}
                        </span>
                        {hasSelection && (
                          <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full font-medium">
                            {sel.mixer}{sel.flavor ? ` - ${sel.flavor}` : ''}
                          </span>
                        )}
                      </div>
                      {isExpanded
                        ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      }
                    </button>

                    {/* Group items */}
                    {isExpanded && (
                      <div className="p-2 space-y-2 bg-card">
                        {grouped[groupName].map(option => {
                          const isSelected = sel?.mixer === option.mixer;
                          return (
                            <div key={option.mixer}>
                              <button
                                onClick={() => handleSelectMixer(groupName, option.mixer)}
                                className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all text-left ${
                                  isSelected
                                    ? 'border-primary bg-primary/10'
                                    : 'border-transparent bg-muted/30 hover:bg-muted/50'
                                }`}
                              >
                                <span className={`font-medium text-sm ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                                  {option.mixer}
                                </span>
                                <span className="font-bold text-sm text-primary">R$ {option.price.toFixed(2)}</span>
                              </button>

                              {/* Flavor sub-selection */}
                              {isSelected && option.flavors && option.flavors.length > 0 && (
                                <div className="mt-2 ml-3 mr-1 space-y-1.5 pb-1">
                                  <p className="text-xs font-medium text-muted-foreground">Escolha o sabor:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {option.flavors.map(flavor => (
                                      <button
                                        key={flavor}
                                        onClick={() => handleSelectFlavor(groupName, flavor)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                                          sel?.flavor === flavor
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted text-foreground hover:bg-muted/80'
                                        }`}
                                      >
                                        {flavor}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Products without groups (no mixers) - no extra UI needed */}

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
            disabled={!canAdd}
            className="w-full bg-primary text-primary-foreground py-4 rounded-lg font-bold text-lg hover:opacity-90 transition-colors disabled:opacity-50"
          >
            {canAdd
              ? `Adicionar R$ ${(currentPrice * quantity).toFixed(2)}`
              : 'Selecione todas as opções'
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
