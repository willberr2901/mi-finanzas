import { NavLink } from 'react-router-dom';
import { Home, Wallet, ShoppingCart, Settings } from 'lucide-react';

const links = [
  { to: '/', icon: Home, label: 'Inicio' },
  { to: '/finanzas', icon: Wallet, label: 'Finanzas' },
  { to: '/mercado', icon: ShoppingCart, label: 'Mercado' },
  { to: '/ajustes', icon: Settings, label: 'Ajustes' },
];

export default function BottomNav() {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-50">
      <div className="bg-[#111827]/80 backdrop-blur-xl border border-white/10 rounded-3xl px-4 py-3 flex justify-around items-center shadow-2xl shadow-black/50">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={label}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 transition-all duration-300 ${
                isActive
                  ? 'text-violet-400 scale-110'
                  : 'text-slate-500 hover:text-slate-300 scale-100'
              }`
            }
          >
            <Icon size={22} strokeWidth={2} />
            <span className="text-[10px] font-medium tracking-wide">{label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
}