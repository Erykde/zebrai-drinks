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

    const checkAndSetAdmin = (u: User | null) => {
      if (!u) {
        if (mounted) {
          setUser(null);
          setIsAdmin(false);
          setLoading(false);
        }
        return;
      }

      if (mounted) setUser(u);

      // Use setTimeout to avoid blocking the auth state change callback
      setTimeout(async () => {
        try {
          const { data } = await supabase.rpc('has_role', {
            _user_id: u.id,
            _role: 'admin',
          });
          if (mounted) setIsAdmin(!!data);
        } catch {
          if (mounted) setIsAdmin(false);
        }
        if (mounted) setLoading(false);
      }, 0);
    };

    // Listener must NOT be async (Supabase requirement)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        checkAndSetAdmin(session?.user ?? null);
      }
    );

    // Fallback: get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      checkAndSetAdmin(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
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
