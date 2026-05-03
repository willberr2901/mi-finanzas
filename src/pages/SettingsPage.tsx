import { useTheme } from '../contexts/ThemeContext';
import { Moon, Sun, Bell, Shield, User, LogOut, ChevronRight, Trash2, Info } from 'lucide-react';

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const bgCard = isDark ? 'bg-white/5' : 'bg-white';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
  const borderColor = isDark ? 'border-white/10' : 'border-gray-200';

  const handleClearData = () => {
    if (confirm('¿Borrar TODOS los datos? Esta acción no se puede deshacer.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const MenuItem = ({ icon: Icon, label, desc, onClick, danger }: any) => (
    <button onClick={onClick} className={`w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors`}>
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${danger ? 'text-red-400' : 'text-green-400'}`} />
        <div className="text-left">
          <p className={`text-sm font-medium ${danger ? 'text-red-400' : textPrimary}`}>{label}</p>
          {desc && <p className={`text-xs ${textSecondary}`}>{desc}</p>}
        </div>
      </div>
      <ChevronRight className={`w-4 h-4 ${textSecondary}`} />
    </button>
  );

  return (
    <div className={`min-h-screen pb-24 ${isDark ? '' : 'bg-gray-50'}`}>
      <div className={`${bgCard} backdrop-blur-md border-b ${borderColor} px-4 py-4`}>
        <h1 className={`text-xl font-bold ${textPrimary}`}>Ajustes</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Perfil */}
        <div className={`${bgCard} backdrop-blur-md border ${borderColor} rounded-xl overflow-hidden`}>
          <div className="px-4 py-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-cyan-400 flex items-center justify-center text-white font-bold text-lg">
              JP
            </div>
            <div>
              <p className={`text-sm font-bold ${textPrimary}`}>Juan Pérez</p>
              <p className={`text-xs ${textSecondary}`}>juan@email.com</p>
            </div>
          </div>
        </div>

        {/* Apariencia */}
        <div className={`${bgCard} backdrop-blur-md border ${borderColor} rounded-xl overflow-hidden`}>
          <div className={`px-4 py-2 ${isDark ? 'bg-white/5' : 'bg-gray-100'} border-b ${borderColor}`}>
            <h3 className={`text-xs font-bold ${textSecondary} uppercase`}>Apariencia</h3>
          </div>
          <MenuItem icon={isDark ? Moon : Sun} label={`Modo ${isDark ? 'Oscuro' : 'Claro'}`} desc="Cambia el tema visual" onClick={toggleTheme} />
        </div>

        {/* Notificaciones */}
        <div className={`${bgCard} backdrop-blur-md border ${borderColor} rounded-xl overflow-hidden`}>
          <div className={`px-4 py-2 ${isDark ? 'bg-white/5' : 'bg-gray-100'} border-b ${borderColor}`}>
            <h3 className={`text-xs font-bold ${textSecondary} uppercase`}>Notificaciones</h3>
          </div>
          <MenuItem icon={Bell} label="Alertas del mercado" desc="Notificaciones de compras" onClick={() => {}} />
          <MenuItem icon={Bell} label="Recordatorios de pago" desc="Servicios y créditos" onClick={() => {}} />
        </div>

        {/* Datos */}
        <div className={`${bgCard} backdrop-blur-md border ${borderColor} rounded-xl overflow-hidden`}>
          <div className={`px-4 py-2 ${isDark ? 'bg-white/5' : 'bg-gray-100'} border-b ${borderColor}`}>
            <h3 className={`text-xs font-bold ${textSecondary} uppercase`}>Datos</h3>
          </div>
          <MenuItem icon={Trash2} label="Borrar datos" desc="Eliminar toda la información" onClick={handleClearData} danger />
        </div>

        {/* Info */}
        <div className={`${bgCard} backdrop-blur-md border ${borderColor} rounded-xl overflow-hidden`}>
          <div className={`px-4 py-2 ${isDark ? 'bg-white/5' : 'bg-gray-100'} border-b ${borderColor}`}>
            <h3 className={`text-xs font-bold ${textSecondary} uppercase`}>Información</h3>
          </div>
          <MenuItem icon={Info} label="Versión" desc="v1.0.0 - Beta" onClick={() => {}} />
          <MenuItem icon={Shield} label="Privacidad" desc="Tus datos son locales" onClick={() => {}} />
        </div>

        <div className="text-center pt-4">
          <p className={`text-xs ${textSecondary}`}>Mi Finanzas © 2026</p>
        </div>
      </div>
    </div>
  );
}