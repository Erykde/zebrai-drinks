import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const checkedUserId = useRef<string | null>(null);

  useEffect(() => {
    const checkRole = async (currentUser: User | null) => {
      setUser(currentUser);
      if (!currentUser) {
        setIsAdmin(false);
        checkedUserId.current = null;
        setLoading(false);
        return;
      }
      // Skip if already checked for this user
      if (checkedUserId.current === currentUser.id) {
        setLoading(false);
        return;
      }
      checkedUserId.current = currentUser.id;
      const { data } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('role', 'admin')
        .maybeSingle();
      setIsAdmin(!!data);
      setLoading(false);
    };

    // Set up listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        checkRole(session?.user ?? null);
      }
    );

    // Then get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      checkRole(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, isAdmin, loading, signOut };
};
