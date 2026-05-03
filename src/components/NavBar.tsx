import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Scan, CreditCard, PieChart, MapPin, Plus } from 'lucide-react';

export default function NavBar() {
  const location = useLocation();

  const menuItems = [
    { path: '/finanzas', icon: PieChart, label: 'Finanzas' },
    { path: '/', icon: ShoppingCart, label: 'Mercado' },
    { path: '/escaner', icon: Scan, label: 'Escáner' },
    { path: '/creditos', icon: CreditCard, label: 'Créditos' },
    { path: '/aire', icon: PieChart, label: 'Aire' },
    { path: '/rutas', icon: MapPin, label: 'Rutas' },
  ];

  return (
    <>
      {/* Barra de navegación inferior */}
      <nav className="fixed bottom-0 left-0 right-0 z-50">
        <div 
          className="flex justify-around items-center px-2 py-3 mx-auto max-w-4xl"
          style={{
            background: 'rgba(6, 26, 26, 0.8)',
            backdropFilter: 'blur(16px)',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.3)'
          }}
        >
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 ${
                  isActive ? 'text-green-400 scale-110' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]' : ''}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Botón FAB central flotante */}
      <button
        className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-16 h-16 rounded-full flex items-center justify-center text-black font-bold text-2xl shadow-[0_0_30px_rgba(0,255,163,0.6)] hover:scale-110 transition-transform"
        style={{
          background: 'linear-gradient(135deg, #00FFA3, #00D1FF)',
        }}
        onClick={() => {
          window.location.href = '/';
        }}
      >
        <Plus className="w-8 h-8" />
      </button>
    </>
  );
}