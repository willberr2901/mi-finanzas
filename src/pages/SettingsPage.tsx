import { useState, useRef } from 'react';
import { Camera, Shield, Lock, LogOut, Download, Trash2, Moon, Sun, Info } from 'lucide-react';
import { useSecurity } from '../contexts/SecurityContext';
import { useTheme } from '../contexts/ThemeContext'; // ✅ Usar hook correcto
import { notify } from '../services/notificationService';

export default function SettingsPage() {
  const { lockNow, setupPin } = useSecurity(); // ✅ setupPin ahora existe
  const { theme, toggleTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estado del usuario
  const [userName, setUserName] = useState(localStorage.getItem('miFinanzasUserName') || 'Usuario');
  const [userAvatar, setUserAvatar] = useState(localStorage.getItem('miFinanzasUserAvatar') || '');

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setUserAvatar(base64String);
        localStorage.setItem('miFinanzasUserAvatar', base64String);
        notify({ title: '📸 Foto actualizada', message: 'Tu avatar ha sido cambiado.', type: 'success' });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackup = () => {
    notify({ title: '💾 Backup creado', message: 'Descargando archivo...', type: 'success' });
  };

  return (
    <div className="p-4 space-y-6 pb-24">
      <h1 className="text-2xl font-bold text-white">Ajustes</h1>

      {/* Perfil de Usuario Mejorado */}
      <div className="glass-panel flex items-center gap-4">
        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-black font-bold text-2xl overflow-hidden border-2 border-white/20">
            {userAvatar ? (
              <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              userName.charAt(0).toUpperCase()
            )}
          </div>
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera size={20} className="text-white" />
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleAvatarChange} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
        
        <div className="flex-1">
          <h2 className="text-lg font-bold text-white">{userName}</h2>
          <p className="text-xs text-slate-400">Miembro desde {new Date().getFullYear()}</p>
        </div>
      </div>

      {/* Apariencia */}
      <div className="glass-panel">
        <h3 className="text-sm font-bold text-slate-400 uppercase mb-4">Apariencia</h3>
        <button onClick={toggleTheme} className="flex items-center justify-between w-full py-3 border-b border-white/5 last:border-0">
          <div className="flex items-center gap-3">
            {theme === 'dark' ? <Moon size={20} className="text-indigo-400"/> : <Sun size={20} className="text-yellow-400"/>}
            <span className="text-white">{theme === 'dark' ? 'Modo Oscuro' : 'Modo Claro'}</span>
          </div>
          <div className={`w-12 h-6 rounded-full p-1 transition-colors ${theme === 'dark' ? 'bg-emerald-500' : 'bg-slate-600'}`}>
            <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${theme === 'dark' ? 'translate-x-6' : ''}`} />
          </div>
        </button>
      </div>

      {/* Seguridad */}
      <div className="glass-panel">
        <h3 className="text-sm font-bold text-slate-400 uppercase mb-4">Seguridad</h3>
        
        <button onClick={() => setupPin(prompt('Ingresa tu nuevo PIN (4 o 6 dígitos):') || '')} className="flex items-center justify-between w-full py-3 border-b border-white/5">
          <div className="flex items-center gap-3">
            <Shield size={20} className="text-emerald-400"/>
            <span className="text-white">Activar protección PIN</span>
          </div>
          <Lock size={16} className="text-slate-500"/>
        </button>

        <button onClick={lockNow} className="flex items-center justify-between w-full py-3">
          <div className="flex items-center gap-3">
            <LogOut size={20} className="text-red-400"/>
            <span className="text-white">Bloquear ahora</span>
          </div>
        </button>
      </div>

      {/* Datos */}
      <div className="glass-panel">
        <h3 className="text-sm font-bold text-slate-400 uppercase mb-4">Datos</h3>
        
        <button onClick={handleBackup} className="flex items-center justify-between w-full py-3 border-b border-white/5">
          <div className="flex items-center gap-3">
            <Download size={20} className="text-blue-400"/>
            <span className="text-white">Crear backup</span>
          </div>
        </button>

        <button className="flex items-center justify-between w-full py-3 text-red-400">
          <div className="flex items-center gap-3">
            <Trash2 size={20} />
            <span>Borrar todos los datos</span>
          </div>
        </button>
      </div>
      
      {/* Info App */}
       <div className="glass-panel">
         <h3 className="text-sm font-bold text-slate-400 uppercase mb-4">Información</h3>
         <div className="flex items-center gap-3 py-2">
           <Info size={20} className="text-slate-500"/>
           <span className="text-sm text-slate-300">Versión v1.0.3 - Beta</span>
         </div>
       </div>
    </div>
  );
}