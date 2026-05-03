import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, Scan, CreditCard, PieChart, MapPin, Plus, Settings } from 'lucide-react';

export default function NavBar() {
  const location = useLocation();

  const menuItems = [
    { path: '/', icon: Home, label: 'Inicio' },
    { path: '/mercado', icon: ShoppingCart, label: 'Mercado' },
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
            background: 'rgba(6, 26, 26, 0.95)',
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
          
          {/* Botón Central "+" - Redirige a Inicio */}
          <button
            onClick={() => window.location.href = '/'}
            className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 w-14 h-14 rounded-full flex items-center justify-center text-black font-bold text-2xl shadow-[0_0_30px_rgba(0,255,163,0.6)] hover:scale-110 transition-transform bg-gradient-to-r from-green-400 to-cyan-400"
          >
            <Plus className="w-8 h-8" />
          </button>
        </div>
      </nav>

      {/* Botón de Ajustes (arriba a la derecha) */}
      <button
        onClick={() => alert('Menú de Ajustes - Próximamente')}
        className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
      >
        <Settings className="w-5 h-5" />
      </button>
    </>
  );
}