import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useProducts, useCategories, DbProduct } from '@/hooks/useProducts';
import ProductCard from '@/components/ProductCard';
import ProductDetail from '@/components/ProductDetail';
import { Home, ShoppingCart, Search } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import zebraiLogo from '@/assets/zebrai-logo.jpg';

const Index = () => {
  const { data: products = [], isLoading } = useProducts();
  const { data: categories = ['Todos'] } = useCategories();
  const { cartCount } = useStore();
  const [category, setCategory] = useState('Todos');
  const [selectedProduct, setSelectedProduct] = useState<DbProduct | null>(null);
  const [search, setSearch] = useState('');
  const tabsRef = useRef<HTMLDivElement>(null);

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

      {/* Category Tabs - sticky */}
      <div ref={tabsRef} className="sticky top-[60px] z-40 bg-card border-b border-border">
        <div className="flex overflow-x-auto scrollbar-hide max-w-lg mx-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                category === cat
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Search bar */}
      <div className="max-w-lg mx-auto px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Pesquise um produto"
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
              <div className="bg-card rounded-xl border border-border overflow-hidden divide-y divide-border">
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

      {/* Bottom Navigation */}
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
