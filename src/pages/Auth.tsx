import { useState } from 'react';
import { useNavigate, Navigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import zebraiLogo from '@/assets/zebrai-logo.jpg';

const Auth = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'login'; // 'login' | 'signup' | 'admin'
  const [isSignup, setIsSignup] = useState(mode === 'signup');
  const isAdminLogin = mode === 'admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // If already logged in
  if (!authLoading && user) {
    if (isAdminLogin && isAdmin) return <Navigate to="/admin" replace />;
    if (!isAdminLogin) return <Navigate to="/perfil" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (isAdminLogin) {
        const { data: adminRole } = await supabase
          .from('user_roles')
          .select('id')
          .eq('user_id', authData.user.id)
          .eq('role', 'admin')
          .maybeSingle();
        if (adminRole) {
          toast.success('Login realizado!');
          navigate('/admin', { replace: true });
        } else {
          toast.error('Você não tem permissão de administrador.');
          await supabase.auth.signOut();
        }
      } else {
        toast.success('Login realizado!');
        navigate('/perfil', { replace: true });
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao autenticar');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Preencha seu nome'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { display_name: name.trim(), phone: phone.trim() },
        },
      });
      if (error) throw error;
      toast.success('Cadastro realizado! Verifique seu email para confirmar.');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao cadastrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <img src={zebraiLogo} alt="Zebrai" className="w-16 h-16 rounded-full object-cover shadow-md" />
          <h1 className="font-display text-2xl text-foreground mt-3">
            {isAdminLogin ? 'ADMIN 🦓' : isSignup ? 'CRIAR CONTA' : 'ENTRAR'}
          </h1>
          {!isAdminLogin && (
            <p className="text-sm text-muted-foreground mt-1">
              {isSignup ? 'Cadastre-se para fazer pedidos' : 'Acesse sua conta'}
            </p>
          )}
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <form onSubmit={isSignup ? handleSignup : handleLogin} className="space-y-4">
            {isSignup && (
              <>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Nome</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm"
                    placeholder="Seu nome"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">WhatsApp</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm"
                    placeholder="(41) 99999-9999"
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Senha</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Aguarde...' : isSignup ? 'Criar conta' : 'Entrar'}
            </button>
          </form>

          {!isAdminLogin && (
            <button
              onClick={() => setIsSignup(!isSignup)}
              className="w-full text-center text-sm text-primary font-medium mt-4 hover:underline"
            >
              {isSignup ? 'Já tem conta? Entrar' : 'Não tem conta? Cadastre-se'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
