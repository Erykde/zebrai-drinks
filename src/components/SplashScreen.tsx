import { useState, useEffect } from 'react';
import zebraiLogo from '@/assets/zebrai-logo.jpg';

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen = ({ onFinish }: SplashScreenProps) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeOut(true), 4000);
    const finishTimer = setTimeout(() => onFinish(), 5000);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background transition-opacity duration-1000 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Logo grande e centralizada */}
      <div className="w-36 h-36 rounded-full overflow-hidden shadow-2xl border-0 bg-white flex items-center justify-center">
        <img
          src={zebraiLogo}
          alt="Zebrai Drinks"
          className="w-full h-full object-contain"
        />
      </div>

      {/* Bolinhas animadas */}
      <div className="mt-10 flex gap-3">
        <span className="w-4 h-4 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-4 h-4 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-4 h-4 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>

      {/* Texto */}
      <p className="mt-4 text-primary font-medium text-lg">Carregando...</p>
    </div>
  );
};

export default SplashScreen;
