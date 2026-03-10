import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useProducts, useCategories, DbProduct } from '@/hooks/useProducts';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import ProductCard from '@/components/ProductCard';
import ProductDetail from '@/components/ProductDetail';
import { Home, ShoppingCart, Search } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import zebraiLogo from '@/assets/zebrai-logo.jpg';
import bannerDrinks from '@/assets/banner-drinks.jpg';

const categoryEmojis: Record<string, string> = {
  'Todos': '🍻',
  'Kit Copão': '🥤',
  'Energéticos': '⚡',
  'Refrigerante': '🥫',
  'Batidinhas': '🍹',
  'Cervejas': '🍺',
  'Doses': '🥃',
  'Combos': '🎉',
};

const Index = () => {
  const { data: products = [], isLoading } = useProducts();
  const { data: categories = ['Todos'] } = useCategories();
  const { data: siteSettings } = useSiteSettings();
  const { cartCount } = useStore();
  const [category, setCategory] = useState('Todos');
  const [selectedProduct, setSelectedProduct] = useState<DbProduct | null>(null);
  const [search, setSearch] = useState('');
  const tabsRef = useRef<HTMLDivElement>(null);

  const bannerImage = siteSettings?.banner_url || bannerDrinks;
  const siteTitle = siteSettings?.site_name || 'BEBIDAS GELADAS';
  const siteSubtitle = siteSettings?.site_subtitle || 'Delivery rápido na sua porta. Kit Copão, energéticos, refrigerantes e batidinhas!';
  const searchPlaceholder = siteSettings?.home_search_placeholder || 'Pesquise um produto';
  const navHomeLabel = siteSettings?.nav_home_label || 'Início';
  const navCartLabel = siteSettings?.nav_cart_label || 'Carrinho';

  const filtered = products.filter(p => {
    const matchCategory = category === 'Todos' || p.category === category;
    const matchSearch = search === '' || p.name.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  // Group products by category for list view
  const grouped = filtered.reduce<Record<string, DbProduct[]>>((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {});

  if (selectedProduct) {
    return (
      <ProductDetail
        product={selectedProduct}
        onBack={() => setSelectedProduct(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <Link to="/auth" className="flex items-center gap-3">
            <img src={zebraiLogo} alt="Zebrai Drinks" className="h-11 w-11 rounded-full object-cover border-2 border-primary" />
            <span className="font-display text-xl tracking-wider text-foreground">ZEBRAI DRINKS</span>
          </Link>
          <div className="flex items-center gap-3">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </header>

      {/* Banner Promocional */}
      <div className="relative max-w-lg mx-auto overflow-hidden">
        <img 
          src={bannerImage} 
          alt="Bebidas geladas Zebrai Drinks" 
          className="w-full h-56 sm:h-64 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-secondary via-secondary/70 to-transparent flex flex-col justify-end p-5 pb-6">
          <h1 className="font-display text-4xl sm:text-5xl text-primary leading-none tracking-wider">
            {siteTitle}
          </h1>
          <p className="text-secondary-foreground/80 text-sm sm:text-base mt-2 leading-relaxed">
            {siteSubtitle}
          </p>
        </div>
      </div>

      {/* Category Tabs - pill style */}
      <div ref={tabsRef} className="sticky top-[60px] z-40 bg-background">
        <div className="flex overflow-x-auto scrollbar-hide max-w-lg mx-auto px-4 py-3 gap-2">
          {categories.map(cat => {
            const emoji = categoryEmojis[cat] || '📦';
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`whitespace-nowrap flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all shrink-0 ${
                  category === cat
                    ? 'bg-primary text-primary-foreground shadow-gold'
                    : 'bg-card text-muted-foreground border border-border hover:border-primary/50'
                }`}
              >
                <span>{emoji}</span>
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search bar */}
      <div className="max-w-lg mx-auto px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-full border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Product List */}
      <main className="max-w-lg mx-auto px-4">
        {isLoading ? (
          <div className="space-y-4 mt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-4 p-4 bg-card rounded-xl border border-border animate-pulse">
                <div className="w-24 h-24 bg-muted rounded-lg shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-5 bg-muted rounded w-1/3 mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            Nenhum produto encontrado.
          </p>
        ) : (
          Object.entries(grouped).map(([cat, items]) => (
            <section key={cat} className="mb-6">
              <div className="border-l-4 border-primary pl-3 mb-3">
                <h2 className="font-display text-xl text-primary">{cat}</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {items.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onClick={() => setSelectedProduct(product)}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      {/* WhatsApp Help Button */}
      <a
        href="https://wa.me/5541984296633?text=Ol%C3%A1%20Zebrai%20Drinks!%20Preciso%20de%20ajuda%20%F0%9F%A6%93"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-20 right-4 z-50 bg-green-500 hover:bg-green-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110"
        aria-label="Falar com a Zebrai no WhatsApp"
      >
        <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>

      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
        <div className="flex items-center justify-around max-w-lg mx-auto py-2">
          <Link to="/" className="flex flex-col items-center gap-0.5 text-primary">
            <Home className="h-5 w-5" />
            <span className="text-[11px] font-medium">Início</span>
          </Link>
          <Link to="/cart" className="flex flex-col items-center gap-0.5 text-muted-foreground relative">
            <ShoppingCart className="h-5 w-5" />
            <span className="text-[11px] font-medium">Carrinho</span>
            {cartCount > 0 && (
              <span className="absolute -top-1 right-0 bg-accent text-accent-foreground text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default Index;
