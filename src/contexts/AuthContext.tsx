import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAdmin = useCallback(async (u: User | null) => {
    if (!u) {
      setUser(null);
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    setUser(u);

    try {
      const { data } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', u.id)
        .eq('role', 'admin')
        .maybeSingle();
      setIsAdmin(!!data);
    } catch {
      setIsAdmin(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Set up listener FIRST (Supabase requirement)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // Use queueMicrotask to avoid lock contention
        queueMicrotask(() => {
          checkAdmin(session?.user ?? null);
        });
      }
    );

    // Then get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      checkAdmin(session?.user ?? null);
    }).catch(() => {
      setLoading(false);
    });

    // Safety timeout - never leave user stuck on loading
    const timeout = setTimeout(() => {
      setLoading(prev => {
        if (prev) {
          console.warn('Auth loading timeout - forcing ready state');
          return false;
        }
        return prev;
      });
    }, 5000);

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [checkAdmin]);

  const signOut = async () => {
    setUser(null);
    setIsAdmin(false);
    setLoading(false);
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Sign out error:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
