import { useTheme } from '../contexts/ThemeContext';
import { Moon, Sun, Bell, Shield, User, LogOut, ChevronRight } from 'lucide-react';

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const handleClearData = () => {
    if (confirm('¿Estás seguro de borrar todos los datos? Esta acción no se puede deshacer.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const bgCard = isDark ? 'bg-white/5' : 'bg-white';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
  const borderColor = isDark ? 'border-white/10' : 'border-gray-200';

  return (
    <div className={`min-h-screen pb-24 ${isDark ? '' : 'bg-gray-50'}`}>
      <div className={`${bgCard} backdrop-blur-md border-b ${borderColor} p-5`}>
        <h1 className={`text-2xl font-bold ${textPrimary}`}>Ajustes</h1>
        <p className={`text-sm ${textSecondary}`}>Personaliza tu experiencia</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Apariencia */}
        <div className={`${bgCard} backdrop-blur-md border ${borderColor} rounded-xl overflow-hidden`}>
          <div className={`px-4 py-3 ${isDark ? 'bg-white/5' : 'bg-gray-100'} border-b ${borderColor}`}>
            <h3 className={`text-sm font-bold ${textPrimary}`}>Apariencia</h3>
          </div>
          
          <button
            onClick={toggleTheme}
            className="w-full px-4 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              {isDark ? <Moon className="w-5 h-5 text-blue-400" /> : <Sun className="w-5 h-5 text-yellow-400" />}
              <div className="text-left">
                <p className={`text-sm font-medium ${textPrimary}`}>Modo {isDark ? 'Oscuro' : 'Claro'}</p>
                <p className={`text-xs ${textSecondary}`}>{isDark ? 'Tema oscuro activado' : 'Tema claro activado'}</p>
              </div>
            </div>
            <ChevronRight className={`w-5 h-5 ${textSecondary}`} />
          </button>
        </div>

        {/* Notificaciones */}
        <div className={`${bgCard} backdrop-blur-md border ${borderColor} rounded-xl overflow-hidden`}>
          <div className={`px-4 py-3 ${isDark ? 'bg-white/5' : 'bg-gray-100'} border-b ${borderColor}`}>
            <h3 className={`text-sm font-bold ${textPrimary}`}>Notificaciones</h3>
          </div>
          
          <button className="w-full px-4 py-4 flex items-center justify-between hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-green-400" />
              <div className="text-left">
                <p className={`text-sm font-medium ${textPrimary}`}>Alertas</p>
                <p className={`text-xs ${textSecondary}`}>Notificaciones del mercado</p>
              </div>
            </div>
            <ChevronRight className={`w-5 h-5 ${textSecondary}`} />
          </button>
        </div>

        {/* Datos */}
        <div className={`${bgCard} backdrop-blur-md border ${borderColor} rounded-xl overflow-hidden`}>
          <div className={`px-4 py-3 ${isDark ? 'bg-white/5' : 'bg-gray-100'} border-b ${borderColor}`}>
            <h3 className={`text-sm font-bold ${textPrimary}`}>Datos</h3>
          </div>
          
          <button
            onClick={handleClearData}
            className="w-full px-4 py-4 flex items-center justify-between hover:bg-red-500/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-red-400" />
              <div className="text-left">
                <p className="text-sm font-medium text-red-400">Borrar todos los datos</p>
                <p className={`text-xs ${textSecondary}`}>Eliminar toda la información</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-red-400" />
          </button>
        </div>

        {/* Perfil */}
        <div className={`${bgCard} backdrop-blur-md border ${borderColor} rounded-xl overflow-hidden`}>
          <div className={`px-4 py-3 ${isDark ? 'bg-white/5' : 'bg-gray-100'} border-b ${borderColor}`}>
            <h3 className={`text-sm font-bold ${textPrimary}`}>Cuenta</h3>
          </div>
          
          <button className="w-full px-4 py-4 flex items-center justify-between hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-purple-400" />
              <div className="text-left">
                <p className={`text-sm font-medium ${textPrimary}`}>Perfil</p>
                <p className={`text-xs ${textSecondary}`}>juan@email.com</p>
              </div>
            </div>
            <ChevronRight className={`w-5 h-5 ${textSecondary}`} />
          </button>
        </div>

        {/* Versión */}
        <div className="text-center pt-4">
          <p className={`text-xs ${textSecondary}`}>Mi Finanzas v1.0.0</p>
          <p className={`text-xs ${textSecondary}`}>© 2026 - Todos los derechos reservados</p>
        </div>
      </div>
    </div>
  );
}