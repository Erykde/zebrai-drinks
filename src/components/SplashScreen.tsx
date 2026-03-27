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
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-secondary transition-opacity duration-1000 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <img
        src={zebraiLogo}
        alt="Zebrai Drinks"
        className="w-32 h-32 rounded-full border-4 border-primary shadow-gold animate-pulse"
      />
      <h1 className="mt-6 font-display text-4xl tracking-wider text-primary">
        ZEBRAI DRINKS
      </h1>
      <div className="mt-8 flex gap-2">
        <span className="w-3 h-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-3 h-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-3 h-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <p className="mt-4 text-muted-foreground text-sm">Carregando...</p>
    </div>
  );
};

export default SplashScreen;
