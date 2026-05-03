import { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';

export default function UpdatePrompt() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [newVersion, setNewVersion] = useState('');

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const res = await fetch('/version.json?t=' + Date.now());
        const data = await res.json();
        const storedVersion = localStorage.getItem('appVersion');
        if (storedVersion && storedVersion !== data.version) {
          setNewVersion(data.version);
          setShowUpdate(true);
        }
      } catch (e) {
        // Silent fail
      }
    };
    checkVersion();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(reg => {
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setNewVersion('nueva versión');
                setShowUpdate(true);
              }
            });
          }
        });
      });

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  }, []);

  const handleUpdate = () => {
    localStorage.removeItem('appVersion');
    caches.keys().then(names => names.forEach(name => caches.delete(name)));
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg?.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      });
    }
    localStorage.setItem('appVersion', newVersion);
    window.location.reload();
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed top-12 left-3 right-3 z-[100] animate-slide-down">
      <div className="bg-gradient-to-r from-green-600 to-cyan-600 p-3 rounded-xl shadow-2xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-white animate-spin" />
          <div className="text-white">
            <p className="font-bold text-xs">¡Actualización disponible!</p>
            <p className="text-[10px] text-white/90">Nuevas mejoras y correcciones</p>
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={handleUpdate} className="bg-white text-green-600 font-bold py-1.5 px-3 rounded-lg text-xs">Actualizar</button>
          <button onClick={() => setShowUpdate(false)} className="text-white/80 p-1"><X className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  );
}