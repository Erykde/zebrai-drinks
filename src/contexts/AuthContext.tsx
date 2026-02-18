import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

  useEffect(() => {
    let mounted = true;

    const checkAdmin = async (userId: string) => {
      try {
        const { data } = await supabase.rpc('has_role', {
          _user_id: userId,
          _role: 'admin',
        });
        return !!data;
      } catch {
        return false;
      }
    };

    // Listen for auth changes (set up BEFORE getSession)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        const u = session?.user ?? null;
        setUser(u);
        if (u) {
          const admin = await checkAdmin(u.id);
          if (mounted) setIsAdmin(admin);
        } else {
          setIsAdmin(false);
        }
        if (mounted) setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        const admin = await checkAdmin(u.id);
        if (mounted) setIsAdmin(admin);
      } else {
        setIsAdmin(false);
      }
      if (mounted) setLoading(false);
    });

    // Safety timeout - never stay loading forever
    const timeout = setTimeout(() => {
      if (mounted && loading) {
        setLoading(false);
      }
    }, 5000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const signOut = async () => {
    setUser(null);
    setIsAdmin(false);
    setLoading(false);
    await supabase.auth.signOut().catch(() => {});
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
