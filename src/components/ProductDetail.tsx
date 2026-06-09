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
  const currentPrice = product.is_promotion && product.promotion_price
    ? product.promotion_price
    : hasMixers
      ? selectedMixerPrices || product.price
      : product.price;

  // First group missing a selection (mixer or required flavor)
  const firstIncompleteGroup = useMemo(() => {
    if (!hasMixers) return null;
    for (const g of groupNames) {
      const sel = selections[g];
      if (!sel) return g;
      const opt = product.mixer_options.find(m => m.mixer === sel.mixer);
      if (opt?.flavors && opt.flavors.length > 0 && !sel.flavor) return g;
    }
    return null;
  }, [selections, groupNames, hasMixers, product.mixer_options]);

  const canAdd = firstIncompleteGroup === null;

  const handleSelectMixer = (groupName: string, mixer: string) => {
    setSelections(prev => ({
      ...prev,
      [groupName]: { mixer, flavor: null },
    }));
    // Keep the group open so user can pick a flavor if required
    const opt = product.mixer_options.find(m => m.mixer === mixer);
    if (opt?.flavors && opt.flavors.length > 0) {
      setExpandedGroup(groupName);
    }
  };

  const handleSelectFlavor = (groupName: string, flavor: string) => {
    setSelections(prev => ({
      ...prev,
      [groupName]: { ...prev[groupName], flavor },
    }));
  };

  const handleIncompleteClick = () => {
    if (!firstIncompleteGroup) return;
    setExpandedGroup(firstIncompleteGroup);
    const sel = selections[firstIncompleteGroup];
    if (sel) {
      toast.error(`Escolha o sabor de ${sel.mixer}`);
    } else {
      toast.error(`Escolha uma opção em "${firstIncompleteGroup}"`);
    }
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
                const selOpt = sel ? product.mixer_options.find(m => m.mixer === sel.mixer) : null;
                const needsFlavor = !!(selOpt?.flavors && selOpt.flavors.length > 0 && !sel?.flavor);

                return (
                  <div key={groupName} className={`border rounded-xl overflow-hidden ${needsFlavor ? 'border-destructive' : 'border-border'}`}>
                    {/* Group header */}
                    <button
                      type="button"
                      onClick={() => setExpandedGroup(prev => prev === groupName ? null : groupName)}
                      className="w-full flex items-center justify-between p-3.5 bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-foreground">
                          {groupName}
                        </span>
                        {hasSelection && (
                          <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full font-medium">
                            {sel.mixer}{sel.flavor ? ` - ${sel.flavor}` : ''}
                          </span>
                        )}
                        {needsFlavor && (
                          <span className="text-xs bg-destructive/15 text-destructive px-2 py-0.5 rounded-full font-medium">
                            Escolha o sabor
                          </span>
                        )}
                      </div>
                      {isExpanded
                        ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      }
                    </button>


                    {/* Group items - vertical scrollable list with big images */}
                    {isExpanded && (
                      <div className="bg-card">
                        <div className="max-h-[420px] overflow-y-auto p-3 space-y-3">
                          {grouped[groupName].map(option => {
                            const isSelected = sel?.mixer === option.mixer;
                            return (
                              <div key={option.mixer} className="space-y-2">
                                <button
                                  onClick={() => handleSelectMixer(groupName, option.mixer)}
                                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                                    isSelected
                                      ? 'border-primary bg-primary/10'
                                      : 'border-border bg-muted/20 hover:bg-muted/40'
                                  }`}
                                >
                                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted shrink-0 flex items-center justify-center">
                                    {option.image_url ? (
                                      <img src={option.image_url} alt={option.mixer} className="w-full h-full object-cover" />
                                    ) : (
                                      <span className="text-3xl">🥤</span>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`font-semibold text-sm ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                                      {option.mixer}
                                    </p>
                                    <p className="font-bold text-base text-primary mt-1">R$ {option.price.toFixed(2)}</p>
                                  </div>
                                  {isSelected && (
                                    <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full font-bold shrink-0">
                                      ✓
                                    </span>
                                  )}
                                </button>

                                {/* Flavor sub-selection - grid with images */}
                                {isSelected && option.flavors && option.flavors.length > 0 && (
                                  <div className="ml-2 space-y-2 pb-2">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Escolha o sabor:</p>
                                    <div className="grid grid-cols-3 gap-2">
                                      {option.flavors.map((flavorItem) => {
                                        const flavorName = typeof flavorItem === 'string' ? flavorItem : flavorItem.name;
                                        const flavorImage = typeof flavorItem === 'string' ? undefined : flavorItem.image_url;
                                        const flavorSelected = sel?.flavor === flavorName;
                                        return (
                                          <button
                                            key={flavorName}
                                            onClick={() => handleSelectFlavor(groupName, flavorName)}
                                            className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 transition-all ${
                                              flavorSelected
                                                ? 'border-primary bg-primary/10'
                                                : 'border-border bg-muted/20 hover:bg-muted/40'
                                            }`}
                                          >
                                            <div className="w-full aspect-square rounded-md overflow-hidden bg-muted flex items-center justify-center">
                                              {flavorImage ? (
                                                <img src={flavorImage} alt={flavorName} className="w-full h-full object-cover" />
                                              ) : (
                                                <span className="text-2xl">🍓</span>
                                              )}
                                            </div>
                                            <span className={`text-[11px] font-medium text-center leading-tight ${flavorSelected ? 'text-primary' : 'text-foreground'}`}>
                                              {flavorName}
                                            </span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
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
            onClick={canAdd ? handleAddToCart : handleIncompleteClick}
            className={`w-full py-4 rounded-lg font-bold text-lg transition-colors ${
              canAdd
                ? 'bg-primary text-primary-foreground hover:opacity-90'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {canAdd
              ? `Adicionar R$ ${(currentPrice * quantity).toFixed(2)}`
              : firstIncompleteGroup
                ? `Falta escolher em "${firstIncompleteGroup}"`
                : 'Selecione todas as opções'
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
