import { useEffect, useState } from 'react';
import { RefreshCw, X, Download } from 'lucide-react';

export default function UpdatePrompt() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [newVersion, setNewVersion] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const checkForUpdate = async () => {
      try {
        const currentVersion = localStorage.getItem('appVersion') || '1.0.0';
        const res = await fetch('/version.json?t=' + Date.now());
        if (!res.ok) return;
        const data = await res.json();
        
        if (data.version && data.version !== currentVersion) {
          setNewVersion(data.version);
          setShowUpdate(true);
        }
      } catch (e) {
        console.log('Version check failed:', e);
      }
    };

    checkForUpdate();
    // Verificar cada 5 minutos
    const interval = setInterval(checkForUpdate, 5 * 60 * 1000);

    // Escuchar cambios en Service Worker
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

    return () => clearInterval(interval);
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);
    
    try {
      // 1. Limpiar TODOS los caches
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      
      // 2. Guardar nueva versión
      localStorage.setItem('appVersion', newVersion);
      
      // 3. Forzar actualización del Service Worker
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg?.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        if (reg?.active) {
          reg.active.postMessage({ type: 'SKIP_WAITING' });
        }
      }
      
      // 4. Limpiar localStorage de datos temporales (NO borrar datos del usuario)
      // Mantener solo datos importantes del usuario
      const userData = {
        userName: localStorage.getItem('miFinanzasUserName'),
        welcomeDone: localStorage.getItem('miFinanzasWelcomeDone'),
        termsAccepted: localStorage.getItem('miFinanzasTermsAccepted'),
        theme: localStorage.getItem('miFinanzasTheme'),
        marketBudget: localStorage.getItem('marketBudget'),
      };
      
      // Borrar todo y restaurar datos del usuario
      localStorage.clear();
      Object.entries(userData).forEach(([key, value]) => {
        if (value !== null) localStorage.setItem(key, value);
      });
      
    } catch (e) {
      console.error('Update failed:', e);
    }

    // 5. Recargar la página
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed top-12 left-3 right-3 z-[100]">
      <div className="bg-gradient-to-r from-green-600 via-cyan-600 to-blue-600 p-4 rounded-2xl shadow-2xl border border-white/20">
        {/* Barra superior */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {isUpdating ? (
              <RefreshCw className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Download className="w-5 h-5 text-white animate-bounce" />
            )}
            <div>
              <p className="font-bold text-white text-sm">
                {isUpdating ? 'Actualizando...' : '¡Nueva versión disponible!'}
              </p>
              <p className="text-xs text-white/80">
                {isUpdating ? 'Limpiando caché y descargando...' : `Versión ${newVersion} lista para instalar`}
              </p>
            </div>
          </div>
          {!isUpdating && (
            <button onClick={() => setShowUpdate(false)} className="text-white/60 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* Contenido del update */}
        {!isUpdating && (
          <div className="bg-black/30 rounded-xl p-3 mb-3">
            <p className="text-xs text-white/90">
              📋 <strong>Esta actualización incluye:</strong><br/>
              • Mejoras en el módulo de Mercado<br/>
              • Corrección de créditos y préstamos<br/>
              • Nuevo historial de facturas<br/>
              • Optimización general
            </p>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-2">
          {!isUpdating ? (
            <>
              <button onClick={handleUpdate}
                className="flex-1 bg-white text-green-600 font-bold py-2.5 rounded-xl text-sm hover:bg-gray-100 transition-all flex items-center justify-center gap-2">
                <Download className="w-4 h-4" />
                Actualizar ahora
              </button>
              <button onClick={() => setShowUpdate(false)}
                className="px-4 py-2.5 rounded-xl text-white/80 text-sm border border-white/30 hover:bg-white/10">
                Después
              </button>
            </>
          ) : (
            <div className="w-full bg-white/20 rounded-xl h-10 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              <span className="text-white text-sm">Actualizando...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}