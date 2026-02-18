import { ShoppingCart, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';
import zebraiLogo from '@/assets/zebrai-logo.jpg';

const Header = () => {
  const { cartCount } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const links = [
    { to: '/', label: 'Cardápio' },
    { to: '/cart', label: 'Carrinho' },
    { to: '/admin', label: 'ADM' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-secondary text-secondary-foreground shadow-lg">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          <img src={zebraiLogo} alt="Zebrai Drinks" className="h-12 w-12 rounded-full object-cover border-2 border-primary" />
          <span className="font-display text-2xl tracking-wider text-primary">ZEBRAI DRINKS</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`font-medium transition-colors hover:text-primary ${
                location.pathname === link.to ? 'text-primary' : 'text-secondary-foreground'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link to="/cart" className="relative">
            <ShoppingCart className="h-6 w-6 text-secondary-foreground hover:text-primary transition-colors" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </Link>
        </nav>

        {/* Mobile */}
        <div className="flex items-center gap-4 md:hidden">
          <Link to="/cart" className="relative">
            <ShoppingCart className="h-6 w-6 text-secondary-foreground" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </Link>
          <button onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="md:hidden bg-secondary border-t border-border/20 animate-slide-in">
          {links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className={`block px-6 py-3 font-medium transition-colors hover:bg-secondary/80 ${
                location.pathname === link.to ? 'text-primary' : 'text-secondary-foreground'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
};

export default Header;
