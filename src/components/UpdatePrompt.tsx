import { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';

export default function UpdatePrompt() {
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
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
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg?.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      });
      window.location.reload();
    }
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-[100] animate-slide-down">
      <div className="bg-gradient-to-r from-green-600 to-cyan-600 p-4 rounded-2xl shadow-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-full">
            <RefreshCw className="w-5 h-5 text-white animate-spin" />
          </div>
          <div className="text-white">
            <p className="font-bold text-sm">¡Nueva versión disponible!</p>
            <p className="text-xs text-white/90">Actualiza para disfrutar las mejoras</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleUpdate}
            className="bg-white text-green-600 font-bold py-2 px-4 rounded-lg text-sm hover:bg-gray-100 transition"
          >
            Actualizar
          </button>
          <button
            onClick={() => setShowUpdate(false)}
            className="text-white/80 hover:text-white p-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}