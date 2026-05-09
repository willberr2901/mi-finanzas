import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Wallet, Settings, ChevronUp, ChevronDown, ShoppingCart, Scan, CreditCard, PieChart, FileText } from 'lucide-react';

const MODULES = [
  { id: 'mercado', icon: ShoppingCart, label: 'Mercado' },
  { id: 'escaner', icon: Scan, label: 'Escáner' },
  { id: 'creditos', icon: CreditCard, label: 'Créditos' },
  { id: 'rentabilidad', icon: PieChart, label: 'Rentabilidad' },
  { id: 'historial', icon: FileText, label: 'Historial' }
];

export default function SmartNavBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const currentMain = location.pathname === '/' ? 'inicio' : 
                      location.pathname === '/finanzas' ? 'finanzas' : 
                      location.pathname === '/ajustes' ? 'ajustes' : null;

  useEffect(() => {
    if (location.pathname === '/' || location.pathname === '/finanzas' || location.pathname === '/ajustes') {
      setExpanded(false);
    }
  }, [location.pathname]);

  return (
    <>
      {expanded && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity" onClick={() => setExpanded(false)} />
      )}
      
      <div className="fixed bottom-0 left-0 right-0 z-50 transition-all duration-300">
        <div className="bg-slate-900/95 backdrop-blur-md border-t border-white/10">
          {expanded && (
            <div className="px-4 pt-4 pb-2 animate-slide-up">
              <div className="grid grid-cols-5 gap-3">
                {MODULES.map(mod => {
                  const isActive = location.pathname === `/${mod.id}` || location.pathname === `/${mod.id}-facturas`;
                  return (
                    <button
                      key={mod.id}
                      onClick={() => { navigate(`/${mod.id}${mod.id === 'historial' ? '-facturas' : ''}`); setExpanded(false); }}
                      className={`flex flex-col items-center py-2 rounded-xl transition-all ${isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                    >
                      <mod.icon size={20} className="mb-1" />
                      <span className="text-[10px] font-medium">{mod.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          
          <div className="flex justify-around items-center px-2 py-3">
            <button onClick={() => navigate('/')} className={`flex flex-col items-center py-1 ${currentMain === 'inicio' ? 'text-emerald-400' : 'text-slate-500'}`}>
              <Home size={22} strokeWidth={currentMain === 'inicio' ? 2.5 : 2} />
              <span className="text-[10px] mt-1">Inicio</span>
            </button>
            <button onClick={() => navigate('/finanzas')} className={`flex flex-col items-center py-1 ${currentMain === 'finanzas' ? 'text-emerald-400' : 'text-slate-500'}`}>
              <Wallet size={22} strokeWidth={currentMain === 'finanzas' ? 2.5 : 2} />
              <span className="text-[10px] mt-1">Finanzas</span>
            </button>
            
            <button onClick={() => setExpanded(!expanded)} className="flex flex-col items-center py-1 text-slate-300 hover:text-emerald-400 transition-colors">
              <div className="w-10 h-10 -mt-4 rounded-full bg-gradient-to-tr from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                {expanded ? <ChevronDown size={20} className="text-black" /> : <ChevronUp size={20} className="text-black" />}
              </div>
              <span className="text-[10px] mt-1">Más</span>
            </button>

            <button onClick={() => navigate('/ajustes')} className={`flex flex-col items-center py-1 ${currentMain === 'ajustes' ? 'text-emerald-400' : 'text-slate-500'}`}>
              <Settings size={22} strokeWidth={currentMain === 'ajustes' ? 2.5 : 2} />
              <span className="text-[10px] mt-1">Ajustes</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}