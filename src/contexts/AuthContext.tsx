import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
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
  const processingRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);

  const handleUser = useCallback(async (u: User | null) => {
    const newId = u?.id ?? null;
    
    // Skip if already processing same user
    if (newId === lastUserIdRef.current && !loading) return;
    if (processingRef.current && newId === lastUserIdRef.current) return;
    
    processingRef.current = true;
    lastUserIdRef.current = newId;

    if (!u) {
      setUser(null);
      setIsAdmin(false);
      setLoading(false);
      processingRef.current = false;
      return;
    }

    setUser(u);

    try {
      const { data } = await supabase.rpc('has_role', {
        _user_id: u.id,
        _role: 'admin',
      });
      // Only update if this is still the current user
      if (lastUserIdRef.current === u.id) {
        setIsAdmin(!!data);
      }
    } catch {
      if (lastUserIdRef.current === u.id) {
        setIsAdmin(false);
      }
    }

    if (lastUserIdRef.current === u.id) {
      setLoading(false);
    }
    processingRef.current = false;
  }, []);

  useEffect(() => {
    // Set up listener FIRST (per Supabase docs)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        handleUser(session?.user ?? null);
      }
    );

    // Then get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [handleUser]);

  const signOut = async () => {
    lastUserIdRef.current = null;
    setUser(null);
    setIsAdmin(false);
    setLoading(false);
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
