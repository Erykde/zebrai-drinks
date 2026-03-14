import { Home, ShoppingCart, ClipboardList, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';

const BottomNav = () => {
  const { cartCount } = useStore();
  const location = useLocation();

  const tabs = [
    { to: '/', icon: Home, label: 'Início' },
    { to: '/cart', icon: ShoppingCart, label: 'Carrinho' },
    { to: '/pedido', icon: ClipboardList, label: 'Pedidos' },
    { to: '/perfil', icon: User, label: 'Perfil' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex items-center justify-around max-w-lg mx-auto py-2">
        {tabs.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <Link key={to} to={to} className={`flex flex-col items-center gap-0.5 relative ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
              <Icon className="h-5 w-5" />
              <span className="text-[11px] font-medium">{label}</span>
              {to === '/cart' && cartCount > 0 && (
                <span className="absolute -top-1 right-0 bg-accent text-accent-foreground text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
