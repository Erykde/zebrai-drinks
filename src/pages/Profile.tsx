import { useNavigate } from 'react-router-dom';
import { User, Ticket, MapPin, LogOut, ChevronRight, CreditCard, Clock, Store } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import BottomNav from '@/components/BottomNav';
import zebraiLogo from '@/assets/zebrai-logo.jpg';

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    toast.success('Você saiu da conta.');
    navigate('/');
  };

  const menuItems = [
    { icon: Ticket, label: 'Cupons', description: 'Seus cupons de desconto', action: () => toast.info('Em breve!') },
    { icon: MapPin, label: 'Endereços', description: 'Seus endereços de entrega', action: () => toast.info('Em breve!') },
    { icon: CreditCard, label: 'Formas de pagamento', description: 'Cartões e PIX', action: () => toast.info('Em breve!') },
    { icon: Clock, label: 'Horário de atendimento', description: '18:00 às 23:00', action: () => {} },
    { icon: Store, label: 'Detalhes da loja', description: 'Informações e localização', action: () => toast.info('Em breve!') },
  ];

  return (
    <div className="min-h-screen bg-muted pb-20">
      {/* Profile header */}
      <div className="bg-card px-4 pt-10 pb-6 text-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary mx-auto flex items-center justify-center overflow-hidden">
          {user ? (
            <img src={zebraiLogo} alt="Perfil" className="w-full h-full object-cover" />
          ) : (
            <User className="h-10 w-10 text-primary" />
          )}
        </div>
        <h1 className="font-display text-2xl text-foreground mt-3">
          {user ? (user.email?.split('@')[0] || 'Meu Perfil') : 'Meu Perfil'}
        </h1>
        {user && (
          <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
        )}
        {!user && (
          <button
            onClick={() => navigate('/auth')}
            className="mt-3 bg-primary text-primary-foreground px-6 py-2 rounded-full font-semibold text-sm"
          >
            Entrar ou cadastrar
          </button>
        )}
      </div>

      {/* Menu items */}
      <div className="max-w-lg mx-auto px-4 mt-4 space-y-2">
        {menuItems.map(({ icon: Icon, label, description, action }) => (
          <button
            key={label}
            onClick={action}
            className="w-full flex items-center gap-3 bg-card rounded-xl p-4 text-left hover:bg-card/80 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <span className="font-semibold text-sm text-foreground">{label}</span>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}

        {user && (
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 bg-card rounded-xl p-4 text-left hover:bg-destructive/10 transition-colors mt-4"
          >
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
              <LogOut className="h-5 w-5 text-destructive" />
            </div>
            <span className="font-semibold text-sm text-destructive">Sair da conta</span>
          </button>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;
