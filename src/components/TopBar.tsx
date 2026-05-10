import { useState, useEffect } from 'react';
import { Menu, Bell } from 'lucide-react';

interface TopBarProps {
  title: string;
  onMenuClick: () => void;
  showBell?: boolean;
  onBellClick?: () => void;
}

export default function TopBar({ title, onMenuClick, showBell = false, onBellClick }: TopBarProps) {
  const [scrolled, setScrolled] = useState(false);

  // Efecto de fondo al hacer scroll
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={`fixed top-0 left-0 right-0 z-40 px-4 py-4 transition-all duration-300 ${scrolled ? 'bg-slate-950/90 backdrop-blur-md shadow-lg border-b border-white/5' : 'bg-transparent'}`}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button 
            onClick={onMenuClick} 
            className="p-2 -ml-2 rounded-xl hover:bg-white/10 text-white transition-colors"
            aria-label="Menú"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-xl font-bold text-white tracking-tight">{title}</h1>
        </div>
        
        {showBell && (
          <button 
            onClick={onBellClick} 
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
          >
            <Bell size={20} />
          </button>
        )}
      </div>
    </div>
  );
}