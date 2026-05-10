import { useState, useEffect } from 'react';
import { X, Home, Wallet, ShoppingCart, Settings, CreditCard, PieChart, Scan, FileText } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

// Definición estricta de tipos para arreglar el error de 'LucideIcon | undefined'
type MenuItem = 
  | { label: string; path: string; icon: any; color: string; divider?: false }
  | { divider: true; label?: never; path?: never; icon?: never; color?: never };

const MENU_ITEMS: MenuItem[] = [
  { label: 'Inicio', path: '/', icon: Home, color: 'text-emerald-400' },
  { label: 'Finanzas', path: '/finanzas', icon: Wallet, color: 'text-blue-400' },
  { label: 'Mercado', path: '/mercado', icon: ShoppingCart, color: 'text-green-400' },
  { divider: true },
  { label: 'Créditos', path: '/creditos', icon: CreditCard, color: 'text-purple-400' },
  { label: 'Rentabilidad', path: '/rentabilidad', icon: PieChart, color: 'text-orange-400' },
  { label: 'Escáner', path: '/escaner', icon: Scan, color: 'text-cyan-400' },
  { label: 'Historial Facturas', path: '/historial-facturas', icon: FileText, color: 'text-pink-400' },
  { divider: true },
  { label: 'Ajustes', path: '/ajustes', icon: Settings, color: 'text-slate-400' },
];

interface SidebarMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SidebarMenu({ isOpen, onClose }: SidebarMenuProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Cerrar si se redimensiona pantalla a desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) onClose();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [onClose]);

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      {/* Overlay Oscuro */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={onClose} 
      />

      {/* Panel Lateral */}
      <div className={`fixed top-0 left-0 h-full w-[85%] max-w-sm bg-slate-900 border-r border-white/10 z-[60] transform transition-transform duration-300 ease-out shadow-2xl ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Header del Sidebar */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-400 to-cyan-500 flex items-center justify-center text-black font-bold text-xl">F$</div>
            <div>
              <h2 className="text-white font-bold text-lg">Mi Finanzas</h2>
              <p className="text-slate-400 text-xs">Gestión Inteligente</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-slate-400">
            <X size={20} />
          </button>
        </div>

        {/* Lista de Opciones */}
        <div className="overflow-y-auto h-[calc(100%-160px)] py-4 px-3 space-y-1">
          {MENU_ITEMS.map((item, idx) => {
            // Si es un divisor, solo renderizamos una línea
            if (item.divider) {
              return <div key={idx} className="h-px bg-white/10 my-4 mx-2" />;
            }

            // Renderizamos el botón (item.icon ahora existe porque filtramos el divisor)
            const Icon = item.icon as any; 
            const isActive = location.pathname === item.path;
            
            return (
              <button
                key={idx}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-emerald-500/10 text-emerald-400 font-semibold' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {/* Casting a any para evitar el error TS2786 de 'LucideIcon | undefined' */}
                <Icon size={20} className={isActive ? 'text-emerald-400' : item.color} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Footer del Sidebar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/5 bg-slate-900">
          <p className="text-xs text-slate-500 text-center">Versión 1.1.0 Pro</p>
        </div>
      </div>
    </>
  );
}