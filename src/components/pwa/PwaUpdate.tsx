import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

export default function PwaUpdate() {
  const { needRefresh, updateServiceWorker } = useRegisterSW();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (needRefresh) {
      setShowBanner(true);
    }
  }, [needRefresh]);

  const handleUpdate = () => {
    updateServiceWorker(true);
    setShowBanner(false);
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm"
        >
          <div className="bg-[#111827] border border-violet-500/30 rounded-3xl p-4 shadow-2xl backdrop-blur-xl relative">
            <button 
              onClick={() => setShowBanner(false)}
              className="absolute top-3 right-3 text-slate-500 hover:text-white"
            >
              <X size={16} />
            </button>
            
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-violet-500/20 rounded-xl">
                <RefreshCw size={20} className="text-violet-400 animate-spin-slow" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">Nueva versión disponible</h3>
                <p className="text-slate-400 text-xs">Mejoras de rendimiento y diseño.</p>
              </div>
            </div>

            <button
              onClick={handleUpdate}
              className="w-full mt-2 bg-violet-600 hover:bg-violet-500 text-white font-bold py-2.5 rounded-xl transition-all text-sm shadow-lg shadow-violet-500/20"
            >
              Actualizar ahora
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}