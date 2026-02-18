import React, { createContext, useContext, useState, useCallback } from 'react';
import { Product, CartItem, Order, initialProducts } from '@/data/products';

interface StoreContextType {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  cart: CartItem[];
  addToCart: (product: Product, selectedMixer?: string, finalPrice?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  orders: Order[];
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const addToCart = useCallback((product: Product, selectedMixer?: string, finalPrice?: number) => {
    setCart(prev => {
      const cartKey = selectedMixer ? `${product.id}-${selectedMixer}` : product.id;
      const existing = prev.find(item => {
        const itemKey = item.selectedMixer ? `${item.product.id}-${item.selectedMixer}` : item.product.id;
        return itemKey === cartKey;
      });
      if (existing) {
        return prev.map(item => {
          const itemKey = item.selectedMixer ? `${item.product.id}-${item.selectedMixer}` : item.product.id;
          return itemKey === cartKey ? { ...item, quantity: item.quantity + 1 } : item;
        });
      }
      return [...prev, { product, quantity: 1, selectedMixer, finalPrice }];
    });
  }, []);

  const removeFromCart = useCallback((cartKey: string) => {
    setCart(prev => prev.filter(item => {
      const itemKey = item.selectedMixer ? `${item.product.id}-${item.selectedMixer}` : item.product.id;
      return itemKey !== cartKey;
    }));
  }, []);

  const updateCartQuantity = useCallback((cartKey: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(item => {
        const itemKey = item.selectedMixer ? `${item.product.id}-${item.selectedMixer}` : item.product.id;
        return itemKey !== cartKey;
      }));
      return;
    }
    setCart(prev =>
      prev.map(item => {
        const itemKey = item.selectedMixer ? `${item.product.id}-${item.selectedMixer}` : item.product.id;
        return itemKey === cartKey ? { ...item, quantity } : item;
      })
    );
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartTotal = cart.reduce((sum, item) => sum + (item.finalPrice ?? item.product.price) * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const addOrder = useCallback((order: Order) => {
    setOrders(prev => [order, ...prev]);
    // Update product stock and sold count
    setProducts(prev =>
      prev.map(p => {
        const orderItem = order.items.find(i => i.product.id === p.id);
        if (orderItem) {
          return {
            ...p,
            stock: p.stock - orderItem.quantity,
            sold: p.sold + orderItem.quantity,
          };
        }
        return p;
      })
    );
    setCart([]);
  }, []);

  const updateOrderStatus = useCallback((orderId: string, status: Order['status']) => {
    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, status } : o))
    );
  }, []);

  return (
    <StoreContext.Provider
      value={{
        products, setProducts, cart, addToCart, removeFromCart,
        updateCartQuantity, clearCart, cartTotal, cartCount,
        orders, addOrder, updateOrderStatus,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};
