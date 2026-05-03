import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useSecurity } from '../contexts/SecurityContext';
import { 
  Moon, Sun, Bell, Shield, User, LogOut, ChevronRight, 
  Trash2, Info, Camera, Edit3, Download, Upload 
} from 'lucide-react';
import { notify } from '../services/notificationService';
import { createBackup, restoreBackup } from '../utils/security';

// Componente reutilizable para items del menú
const MenuItem = ({ 
  icon: Icon, 
  label, 
  desc, 
  onClick, 
  danger = false,
  disabled = false 
}: { 
  icon: React.ElementType; 
  label: string; 
  desc?: string; 
  onClick: () => void; 
  danger?: boolean;
  disabled?: boolean;
}) => {
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${danger ? 'text-red-400' : 'text-green-400'}`} />
        <div className="text-left">
          <p className={`text-sm font-medium ${danger ? 'text-red-400' : 'text-white'}`}>{label}</p>
          {desc && <p className="text-xs text-gray-400">{desc}</p>}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-400" />
    </button>
  );
};

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { 
    isSetup, 
    setupPIN, 
    changePIN, 
    disableSecurity, 
    lockNow 
  } = useSecurity();
  
  const [userName, setUserName] = useState(localStorage.getItem('miFinanzasUserName') || 'Usuario');
  const [userEmail] = useState('usuario@email.com');
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userName);
  const [showPinModal, setShowPinModal] = useState<'setup' | 'change' | 'disable' | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');

  const isDark = theme === 'dark';
  const bgCard = isDark ? 'bg-white/5' : 'bg-white';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
  const borderColor = isDark ? 'border-white/10' : 'border-gray-200';

  // Guardar nombre de usuario
  const saveName = () => {
    if (nameInput.trim()) {
      setUserName(nameInput.trim());
      localStorage.setItem('miFinanzasUserName', nameInput.trim());
      setEditingName(false);
      notify({ title: '✅ Nombre actualizado', message: `Hola, ${nameInput.trim()}!`, type: 'success' });
    }
  };

  // Manejar configuración de PIN
  const handlePinAction = async () => {
    if (!pinInput.trim() || pinInput.length < 4) {
      notify({ title: '❌ PIN inválido', message: 'Debe tener al menos 4 dígitos', type: 'error' });
      return;
    }

    if (showPinModal === 'setup') {
      const success = await setupPIN(pinInput);
      if (success) setShowPinModal(null);
    } 
    else if (showPinModal === 'change') {
      if (!newPinInput.trim() || newPinInput.length < 4) {
        notify({ title: '❌ Nuevo PIN inválido', message: 'Debe tener al menos 4 dígitos', type: 'error' });
        return;
      }
      const success = await changePIN(pinInput, newPinInput);
      if (success) {
        setShowPinModal(null);
        setPinInput('');
        setNewPinInput('');
      }
    } 
    else if (showPinModal === 'disable') {
      const success = await disableSecurity(pinInput);
      if (success) setShowPinModal(null);
    }
    
    setPinInput('');
    setNewPinInput('');
  };

  // Crear backup de datos
  const handleBackup = () => {
    try {
      const data = {
        marketItems: JSON.parse(localStorage.getItem('mi-finanzas-market') || '{}'),
        financeData: JSON.parse(localStorage.getItem('mi-finanzas-finance') || '{}'),
        userName: localStorage.getItem('miFinanzasUserName'),
        timestamp: new Date().toISOString()
      };
      
      // En una app real, aquí encriptarías con una clave maestra
      const backup = createBackup(JSON.stringify(data), 'miFinanzasBackupKey2026');
      
      // Descargar archivo
      const blob = new Blob([backup], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mi-finanzas-backup-${new Date().toISOString().split('T')[0]}.enc`;
      a.click();
      URL.revokeObjectURL(url);
      
      notify({ title: '💾 Backup creado', message: 'Archivo de respaldo descargado', type: 'success', duration: 4000 });
    } catch (e) {
      console.error('Error creando backup:', e);
      notify({ title: '❌ Error', message: 'No se pudo crear el backup', type: 'error' });
    }
  };

  // Restaurar backup
  const handleRestore = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.enc,.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        // En una app real, pedirías la clave de desencriptación
        const decrypted = restoreBackup(text, 'miFinanzasBackupKey2026');
        
        if (decrypted) {
          const data = JSON.parse(decrypted);
          // Restaurar datos (con confirmación)
          if (confirm('¿Restaurar datos del backup? Esto reemplazará tu información actual.')) {
            if (data.marketItems?.items) {
              localStorage.setItem('mi-finanzas-market', JSON.stringify(data.marketItems));
            }
            if (data.userName) {
              localStorage.setItem('miFinanzasUserName', data.userName);
              setUserName(data.userName);
            }
            notify({ title: '📥 Backup restaurado', message: 'Tus datos han sido recuperados', type: 'success', duration: 4000 });
            setTimeout(() => window.location.reload(), 1500);
          }
        } else {
          notify({ title: '❌ Error', message: 'No se pudo leer el archivo de backup', type: 'error' });
        }
      } catch (err) {
        console.error('Error restaurando backup:', err);
        notify({ title: '❌ Error', message: 'Archivo inválido o corrupto', type: 'error' });
      }
    };
    input.click();
  };

  // Limpiar todos los datos
  const handleClearAllData = () => {
    if (confirm('⚠️ ¿Estás SEGURO de borrar TODOS los datos? Esta acción NO se puede deshacer.')) {
      if (confirm('Última advertencia: Se perderán todas tus listas, transacciones y configuraciones.')) {
        localStorage.clear();
        notify({ title: '🗑️ Datos borrados', message: 'La app se reiniciará', type: 'warning', duration: 2000 });
        setTimeout(() => window.location.reload(), 1500);
      }
    }
  };

  // Cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem('miFinanzasUserName');
    localStorage.removeItem('miFinanzasWelcomeDone');
    localStorage.removeItem('miFinanzasTutorialSeen');
    notify({ title: '👋 Sesión cerrada', message: 'Gracias por usar Mi Finanzas', type: 'info' });
    setTimeout(() => window.location.reload(), 1000);
  };

  return (
    <div className={`min-h-screen pb-24 ${isDark ? '' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`${bgCard} backdrop-blur-md border-b ${borderColor} px-4 py-3`}>
        <h1 className={`text-lg font-bold ${textPrimary}`}>Ajustes</h1>
      </div>

      <div className="p-3 space-y-4">
        
        {/* Perfil */}
        <div className={`${bgCard} backdrop-blur-md border ${borderColor} rounded-xl overflow-hidden`}>
          <div className="p-4 flex items-center gap-3">
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-400 to-cyan-400 flex items-center justify-center text-white font-bold text-xl">
                {userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
              </div>
              <button className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center border-2 border-gray-900 hover:bg-green-600 transition-colors">
                <Camera className="w-3 h-3 text-white" />
              </button>
            </div>
            <div className="flex-1">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    value={nameInput} 
                    onChange={e => setNameInput(e.target.value)} 
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && saveName()}
                    onBlur={saveName}
                    className={`flex-1 px-2 py-1 rounded-lg bg-white/10 ${textPrimary} text-sm outline-none border border-green-400/50`} 
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-bold ${textPrimary}`}>{userName}</p>
                  <button onClick={() => { setEditingName(true); setNameInput(userName); }} className="p-1 hover:bg-white/10 rounded">
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
          <MenuItem 
            icon={isDark ? Moon : Sun} 
            label={`Modo ${isDark ? 'Oscuro' : 'Claro'}`} 
            desc="Cambia el tema visual de la app" 
            onClick={toggleTheme} 
          />
        </div>

        {/* 🔐 SEGURIDAD */}
        <div className={`${bgCard} backdrop-blur-md border ${borderColor} rounded-xl overflow-hidden`}>
          <div className={`px-4 py-2 ${isDark ? 'bg-white/5' : 'bg-gray-100'} border-b ${borderColor}`}>
            <h3 className={`text-xs font-bold ${textSecondary} uppercase flex items-center gap-2`}>
              <Shield className="w-4 h-4" /> Seguridad
            </h3>
          </div>
          
          <MenuItem 
            icon={Shield} 
            label={isSetup ? '🔄 Cambiar PIN' : '🔐 Activar protección'} 
            desc={isSetup ? 'Modificar tu código de acceso' : 'Proteger tus datos con PIN de 4-6 dígitos'} 
            onClick={() => setShowPinModal(isSetup ? 'change' : 'setup')} 
          />
          
          <MenuItem 
            icon={Shield} 
            label="🔒 Bloquear ahora" 
            desc="Cerrar sesión y bloquear la app inmediatamente" 
            onClick={() => {
              lockNow();
              notify({ title: '🔒 App bloqueada', message: 'Requiere PIN para continuar', type: 'info' });
            }} 
          />
          
          {isSetup && (
            <MenuItem 
              icon={Shield} 
              label="🔓 Desactivar seguridad" 
              desc="Quitar la protección por PIN" 
              onClick={() => setShowPinModal('disable')}
              danger
            />
          )}
        </div>

        {/* Backup y Datos */}
        <div className={`${bgCard} backdrop-blur-md border ${borderColor} rounded-xl overflow-hidden`}>
          <div className={`px-4 py-2 ${isDark ? 'bg-white/5' : 'bg-gray-100'} border-b ${borderColor}`}>
            <h3 className={`text-xs font-bold ${textSecondary} uppercase`}>Datos</h3>
          </div>
          
          <MenuItem 
            icon={Download} 
            label="💾 Crear backup" 
            desc="Descargar copia de seguridad encriptada" 
            onClick={handleBackup} 
          />
          
          <MenuItem 
            icon={Upload} 
            label="📥 Restaurar backup" 
            desc="Recuperar datos desde un archivo" 
            onClick={handleRestore} 
          />
          
          <MenuItem 
            icon={Trash2} 
            label="🗑️ Borrar todos los datos" 
            desc="Eliminar toda la información de la app" 
            onClick={handleClearAllData} 
            danger 
          />
        </div>

        {/* Notificaciones */}
        <div className={`${bgCard} backdrop-blur-md border ${borderColor} rounded-xl overflow-hidden`}>
          <div className={`px-4 py-2 ${isDark ? 'bg-white/5' : 'bg-gray-100'} border-b ${borderColor}`}>
            <h3 className={`text-xs font-bold ${textSecondary} uppercase`}>Notificaciones</h3>
          </div>
          <MenuItem 
            icon={Bell} 
            label="🔔 Alertas del mercado" 
            desc="Notificaciones al agregar o completar productos" 
            onClick={() => notify({ title: '⚙️ Configuración', message: 'Las notificaciones están activas', type: 'info' })} 
          />
          <MenuItem 
            icon={Bell} 
            label="🔄 Actualizaciones" 
            desc="Avisos cuando hay nueva versión de la app" 
            onClick={() => notify({ title: '⚙️ Configuración', message: 'Actualizaciones automáticas activas', type: 'info' })} 
          />
        </div>

        {/* Información */}
        <div className={`${bgCard} backdrop-blur-md border ${borderColor} rounded-xl overflow-hidden`}>
          <div className={`px-4 py-2 ${isDark ? 'bg-white/5' : 'bg-gray-100'} border-b ${borderColor}`}>
            <h3 className={`text-xs font-bold ${textSecondary} uppercase`}>Información</h3>
          </div>
          <MenuItem 
            icon={Info} 
            label="Versión" 
            desc="v1.0.2 - Beta" 
            onClick={() => notify({ title: 'ℹ️ Mi Finanzas', message: 'Desarrollado con ❤️ para ti', type: 'info' })} 
          />
          <MenuItem 
            icon={Shield} 
            label="Privacidad" 
            desc="Tus datos se guardan solo en este dispositivo" 
            onClick={() => notify({ title: '🔒 Privacidad', message: 'No compartimos tus datos con nadie', type: 'info' })} 
          />
        </div>

        {/* Cerrar sesión */}
        <button 
          onClick={handleLogout} 
          className="w-full py-3 rounded-xl font-semibold text-red-400 border border-red-400/30 hover:bg-red-400/10 transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>

        <div className="text-center pt-2 pb-4">
          <p className={`text-xs ${textSecondary}`}>Mi Finanzas © 2026</p>
          <p className={`text-[10px] ${textSecondary} opacity-60`}>Hecho con ❤️ para ti</p>
        </div>
      </div>

      {/* Modal de PIN */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className={`${bgCard} rounded-2xl p-6 max-w-sm w-full border ${borderColor} shadow-2xl`}>
            <h3 className={`text-lg font-bold ${textPrimary} mb-4 text-center`}>
              {showPinModal === 'setup' && '🔐 Crear PIN de seguridad'}
              {showPinModal === 'change' && '🔄 Cambiar PIN'}
              {showPinModal === 'disable' && '🔓 Desactivar seguridad'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className={`text-xs ${textSecondary} block mb-1`}>
                  {showPinModal === 'setup' ? 'Crea un PIN de 4-6 dígitos:' : 'Ingresa tu PIN actual:'}
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={pinInput}
                  onChange={e => setPinInput(e.target.value.replace(/[^0-9]/g, ''))}
                  className={`w-full px-4 py-3 rounded-xl ${isDark ? 'bg-white/10' : 'bg-gray-100'} border ${borderColor} ${textPrimary} text-center text-2xl tracking-[0.5em] outline-none focus:ring-2 focus:ring-green-400/50`}
                  placeholder="••••"
                  autoFocus
                />
              </div>
              
              {showPinModal === 'change' && (
                <div>
                  <label className={`text-xs ${textSecondary} block mb-1`}>Nuevo PIN:</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={newPinInput}
                    onChange={e => setNewPinInput(e.target.value.replace(/[^0-9]/g, ''))}
                    className={`w-full px-4 py-3 rounded-xl ${isDark ? 'bg-white/10' : 'bg-gray-100'} border ${borderColor} ${textPrimary} text-center text-2xl tracking-[0.5em] outline-none focus:ring-2 focus:ring-green-400/50`}
                    placeholder="••••"
                  />
                </div>
              )}
              
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowPinModal(null);
                    setPinInput('');
                    setNewPinInput('');
                  }}
                  className={`flex-1 py-3 rounded-xl font-semibold ${isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'} transition-colors`}
                >
                  Cancelar
                </button>
                <button
                  onClick={handlePinAction}
                  disabled={pinInput.length < 4 || (showPinModal === 'change' && newPinInput.length < 4)}
                  className="flex-1 py-3 rounded-xl font-semibold bg-gradient-to-r from-green-500 to-cyan-500 text-black disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] transition-transform"
                >
                  {showPinModal === 'setup' && 'Activar'}
                  {showPinModal === 'change' && 'Cambiar'}
                  {showPinModal === 'disable' && 'Desactivar'}
                </button>
              </div>
            </div>
            
            <p className={`text-[10px] ${textSecondary} text-center mt-4`}>
              💡 Tip: Usa un PIN que recuerdes pero que otros no adivinen
            </p>
          </div>
        </div>
      )}
    </div>
  );
}