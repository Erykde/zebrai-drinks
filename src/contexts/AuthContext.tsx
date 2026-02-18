import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
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
  const checkedUserId = useRef<string | null>(null);

  useEffect(() => {
    const checkRole = async (currentUser: User | null) => {
      if (!currentUser) {
        setUser(null);
        setIsAdmin(false);
        checkedUserId.current = null;
        setLoading(false);
        return;
      }
      setUser(currentUser);
      if (checkedUserId.current === currentUser.id) {
        setLoading(false);
        return;
      }
      // New user — keep loading true while we verify role
      checkedUserId.current = currentUser.id;
      const { data } = await supabase.rpc('has_role', {
        _user_id: currentUser.id,
        _role: 'admin',
      });
      setIsAdmin(!!data);
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        checkRole(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      checkRole(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
