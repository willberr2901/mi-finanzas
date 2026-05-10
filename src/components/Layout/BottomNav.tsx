import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Wallet, ShoppingCart, Settings } from 'lucide-react';

const items = [
  { path: '/', icon: Home, label: 'Inicio' },
  { path: '/finanzas', icon: Wallet, label: 'Finanzas' },
  { path: '/mercado', icon: ShoppingCart, label: 'Mercado' },
  { path: '/ajustes', icon: Settings, label: 'Ajustes' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0B0F19]/95 backdrop-blur-xl border-t border-white/10 pb-safe">
      <div className="flex justify-around items-center py-2">
        {items.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-1 py-2 px-4 rounded-2xl transition-all duration-200 ${
                isActive 
                  ? 'text-violet-400 bg-violet-500/10' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[11px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}