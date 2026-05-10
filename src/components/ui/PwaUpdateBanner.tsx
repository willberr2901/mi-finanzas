import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Button from './Button';

export default function PwaUpdateBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setShowBanner(true);
      });

      // Verificar si hay nueva versión cada 5 minutos
      const checkInterval = setInterval(async () => {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration?.waiting) {
          setShowBanner(true);
        }
      }, 300000);

      return () => clearInterval(checkInterval);
    }
  }, []);

  const handleUpdate = async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration?.waiting) {
      registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm animate-slide-up">
      <div className="bg-[#111827] border border-violet-500/30 rounded-2xl p-4 shadow-2xl backdrop-blur-xl relative">
        <button 
          onClick={() => setShowBanner(false)}
          className="absolute top-2 right-2 p-1 hover:bg-white/5 rounded-lg"
        >
          <X size={16} className="text-slate-400" />
        </button>
        
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">🚀</span>
          </div>
          
          <div className="flex-1">
            <h3 className="text-white font-semibold">Nueva versión disponible</h3>
            <p className="text-slate-400 text-sm mt-1">
              Hemos mejorado la app con nuevas funciones y correcciones.
            </p>
            
            <div className="mt-3 flex gap-2">
              <Button onClick={handleUpdate} variant="primary" className="flex-1 py-2.5 text-sm">
                Actualizar
              </Button>
              <Button onClick={() => setShowBanner(false)} variant="ghost" className="flex-1 py-2.5 text-sm">
                Luego
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}