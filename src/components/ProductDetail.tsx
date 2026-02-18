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
  const [selectedMixer, setSelectedMixer] = useState<string | null>(null);
  const [selectedFlavor, setSelectedFlavor] = useState<string | null>(null);
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
  const hasGroups = groupNames.length > 1 || (groupNames.length === 1 && groupNames[0] !== 'Outros');

  const selectedOption = product.mixer_options.find(m => m.mixer === selectedMixer);
  const currentPrice = hasMixers && selectedOption
    ? selectedOption.price
    : product.is_promotion && product.promotion_price
      ? product.promotion_price
      : product.price;

  const canAdd = !hasMixers || (selectedMixer !== null && (!selectedOption?.flavors?.length || selectedFlavor !== null));

  const handleSelectMixer = (mixer: string) => {
    setSelectedMixer(mixer);
    setSelectedFlavor(null);
    const opt = product.mixer_options.find(m => m.mixer === mixer);
    // If no flavors, auto-select
    if (!opt?.flavors?.length) {
      setSelectedFlavor(null);
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

    const mixerLabel = selectedMixer
      ? selectedFlavor ? `${selectedMixer} - ${selectedFlavor}` : selectedMixer
      : undefined;

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
          {/* Image or emoji */}
          <div className="relative text-center mb-4">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-40 h-40 mx-auto rounded-xl object-cover" />
            ) : (
              <span className="text-8xl">{product.image_emoji ?? '🍹'}</span>
            )}
            {product.is_promotion && (
              <span className="absolute top-0 right-0 bg-destructive text-destructive-foreground text-xs font-bold px-3 py-1 rounded-full">
                🔥 PROMOÇÃO
              </span>
            )}
          </div>

          <h1 className="font-display text-3xl text-card-foreground mb-2">{product.name}</h1>
          <p className="text-muted-foreground mb-4">{product.description}</p>

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

          {/* Mixer selection - grouped */}
          {hasMixers && hasGroups && (
            <div className="mb-6 space-y-4">
              <p className="text-sm font-medium text-foreground mb-1">Escolha o acompanhamento:</p>
              {groupNames.map(groupName => (
                <div key={groupName} className="border border-border rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedGroup(prev => prev === groupName ? null : groupName)}
                    className="w-full flex items-center justify-between p-3 bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <span className="font-semibold text-card-foreground">{groupName}</span>
                    {expandedGroup === groupName
                      ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    }
                  </button>

                  {expandedGroup === groupName && (
                    <div className="p-2 space-y-2 animate-fade-in">
                      {grouped[groupName].map(option => (
                        <div key={option.mixer}>
                          <button
                            onClick={() => handleSelectMixer(option.mixer)}
                            className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left ${
                              selectedMixer === option.mixer
                                ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <span className="font-medium text-card-foreground">{option.mixer}</span>
                            <span className="font-bold text-primary">R$ {option.price.toFixed(2)}</span>
                          </button>

                          {/* Flavor sub-selection */}
                          {selectedMixer === option.mixer && option.flavors && option.flavors.length > 0 && (
                            <div className="mt-2 ml-4 space-y-1 animate-fade-in">
                              <p className="text-xs text-muted-foreground mb-1">Escolha o sabor:</p>
                              {option.flavors.map(flavor => (
                                <button
                                  key={flavor}
                                  onClick={() => setSelectedFlavor(flavor)}
                                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all ${
                                    selectedFlavor === flavor
                                      ? 'bg-primary text-primary-foreground font-medium'
                                      : 'bg-muted/50 text-card-foreground hover:bg-muted'
                                  }`}
                                >
                                  {flavor}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Flat mixer selection (no groups) */}
          {hasMixers && !hasGroups && (
            <div className="mb-6">
              <p className="text-sm font-medium text-foreground mb-3">Escolha o acompanhamento:</p>
              <div className="flex flex-col gap-2">
                {product.mixer_options.map((option) => (
                  <div key={option.mixer}>
                    <button
                      onClick={() => handleSelectMixer(option.mixer)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left ${
                        selectedMixer === option.mixer
                          ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <span className="font-medium text-card-foreground">{option.mixer}</span>
                      <span className="font-bold text-primary">R$ {option.price.toFixed(2)}</span>
                    </button>

                    {selectedMixer === option.mixer && option.flavors && option.flavors.length > 0 && (
                      <div className="mt-2 ml-4 space-y-1 animate-fade-in">
                        <p className="text-xs text-muted-foreground mb-1">Escolha o sabor:</p>
                        {option.flavors.map(flavor => (
                          <button
                            key={flavor}
                            onClick={() => setSelectedFlavor(flavor)}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all ${
                              selectedFlavor === flavor
                                ? 'bg-primary text-primary-foreground font-medium'
                                : 'bg-muted/50 text-card-foreground hover:bg-muted'
                            }`}
                          >
                            {flavor}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
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
            disabled={!canAdd}
            className="w-full bg-primary text-primary-foreground py-4 rounded-lg font-bold text-lg hover:bg-gold-dark transition-colors shadow-gold disabled:opacity-50"
          >
            {canAdd
              ? `Adicionar R$ ${(currentPrice * quantity).toFixed(2)}`
              : 'Selecione o acompanhamento e sabor'
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
