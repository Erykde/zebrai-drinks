import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProducts, useCategories, DbProduct } from '@/hooks/useProducts';
import Header from '@/components/Header';
import ProductCard from '@/components/ProductCard';
import ProductDetail from '@/components/ProductDetail';
import CategoryFilter from '@/components/CategoryFilter';
import zebraiLogo from '@/assets/zebrai-logo.jpg';

const Index = () => {
  const { data: products = [], isLoading } = useProducts();
  const { data: categories = ['Todos'] } = useCategories();
  const [category, setCategory] = useState('Todos');
  const [selectedProduct, setSelectedProduct] = useState<DbProduct | null>(null);

  const filtered = category === 'Todos'
    ? products
    : products.filter(p => p.category === category);

  if (selectedProduct) {
    return (
      <ProductDetail
        product={selectedProduct}
        onBack={() => setSelectedProduct(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-dark text-secondary-foreground py-16 px-4">
        <div className="container mx-auto text-center">
          <Link to="/auth">
            <img
              src={zebraiLogo}
              alt="Zebrai Drinks"
              className="w-28 h-28 rounded-full mx-auto mb-6 border-4 border-primary shadow-gold object-cover cursor-pointer hover:scale-105 transition-transform"
            />
          </Link>
          <h1 className="font-display text-5xl md:text-7xl text-primary mb-3 tracking-wider">
            ZEBRAI DRINKS
          </h1>
          <p className="text-lg text-secondary-foreground/70 max-w-md mx-auto">
            As melhores bebidas e drinks da cidade. Peça agora e receba em casa! 🦓
          </p>
        </div>
      </section>

      {/* Cardápio */}
      <main className="container mx-auto px-4 py-8">
        <h2 className="font-display text-3xl mb-6 text-foreground">CARDÁPIO</h2>
        <CategoryFilter
          categories={categories}
          selected={category}
          onSelect={setCategory}
        />

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-4 animate-pulse">
                <div className="w-full h-32 bg-muted rounded-lg mb-3" />
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2 mb-3" />
                <div className="h-5 bg-muted rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6">
            {filtered.map((product, i) => (
              <div key={product.id} style={{ animationDelay: `${i * 80}ms` }}>
                <ProductCard
                  product={product}
                  onClick={() => setSelectedProduct(product)}
                />
              </div>
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-12">
            Nenhum produto encontrado nesta categoria.
          </p>
        )}
      </main>
    </div>
  );
};

export default Index;
