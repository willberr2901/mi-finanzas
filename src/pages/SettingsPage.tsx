import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Moon, Sun, Bell, Shield, User, LogOut, ChevronRight, Trash2, Info, Camera, Edit3 } from 'lucide-react';

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const [userName, setUserName] = useState(localStorage.getItem('miFinanzasUserName') || 'Juan Pérez');
  const [userEmail] = useState('juan@email.com');
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userName);

  const isDark = theme === 'dark';
  const bgCard = isDark ? 'bg-white/5' : 'bg-white';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
  const borderColor = isDark ? 'border-white/10' : 'border-gray-200';

  const saveName = () => {
    if (nameInput.trim()) {
      setUserName(nameInput.trim());
      localStorage.setItem('miFinanzasUserName', nameInput.trim());
      setEditingName(false);
    }
  };

  const handleClearData = () => {
    if (confirm('¿Borrar TODOS los datos? Esta acción no se puede deshacer.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('miFinanzasUserName');
    localStorage.removeItem('miFinanzasWelcomeDone');
    window.location.reload();
  };

  const MenuItem = ({ icon: Icon, label, desc, onClick, danger }: any) => (
    <button onClick={onClick} className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors">
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
      {/* Header */}
      <div className={`${bgCard} backdrop-blur-md border-b ${borderColor} px-4 py-3`}>
        <h1 className={`text-lg font-bold ${textPrimary}`}>Ajustes</h1>
      </div>

      <div className="p-3 space-y-3">
        {/* Perfil con Avatar */}
        <div className={`${bgCard} backdrop-blur-md border ${borderColor} rounded-xl overflow-hidden`}>
          <div className="p-4 flex items-center gap-3">
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-400 to-cyan-400 flex items-center justify-center text-white font-bold text-xl">
                {userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
              </div>
              <button className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center border-2 border-gray-900">
                <Camera className="w-3 h-3 text-white" />
              </button>
            </div>
            <div className="flex-1">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input type="text" value={nameInput} onChange={e => setNameInput(e.target.value)} autoFocus
                    onKeyDown={e => e.key === 'Enter' && saveName()}
                    onBlur={saveName}
                    className={`flex-1 px-2 py-1 rounded-lg bg-white/10 ${textPrimary} text-sm outline-none`} />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-bold ${textPrimary}`}>{userName}</p>
                  <button onClick={() => { setEditingName(true); setNameInput(userName); }} className="p-1">
                    <Edit3 className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                </div>
              )}
              <p className={`text-xs ${textSecondary}`}>{userEmail}</p>
            </div>
          </div>
        </div>

        {/* Apariencia */}
        <div className={`${bgCard} backdrop-blur-md border ${borderColor} rounded-xl overflow-hidden`}>
          <div className={`px-4 py-2 ${isDark ? 'bg-white/5' : 'bg-gray-100'} border-b ${borderColor}`}>
            <h3 className={`text-xs font-bold ${textSecondary} uppercase`}>Apariencia</h3>
          </div>
          <MenuItem icon={isDark ? Moon : Sun} label={`Modo ${isDark ? 'Oscuro' : 'Claro'}`} onClick={toggleTheme} />
        </div>

        {/* Notificaciones */}
        <div className={`${bgCard} backdrop-blur-md border ${borderColor} rounded-xl overflow-hidden`}>
          <div className={`px-4 py-2 ${isDark ? 'bg-white/5' : 'bg-gray-100'} border-b ${borderColor}`}>
            <h3 className={`text-xs font-bold ${textSecondary} uppercase`}>Notificaciones</h3>
          </div>
          <MenuItem icon={Bell} label="Alertas del mercado" desc="Notificaciones de compras" onClick={() => {}} />
          <MenuItem icon={Bell} label="Actualizaciones" desc="Nuevas versiones de la app" onClick={() => {}} />
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
          <MenuItem icon={Info} label="Versión" desc="v1.0.2 - Beta" onClick={() => {}} />
          <MenuItem icon={Shield} label="Privacidad" desc="Tus datos son locales" onClick={() => {}} />
        </div>

        {/* Cerrar sesión */}
        <button onClick={handleLogout} className="w-full py-3 rounded-xl font-semibold text-red-400 border border-red-400/30 hover:bg-red-400/10 transition-colors flex items-center justify-center gap-2">
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>

        <div className="text-center pt-2">
          <p className={`text-xs ${textSecondary}`}>Mi Finanzas © 2026</p>
        </div>
      </div>
    </div>
  );
}