import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function PwaUpdateBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(reg => {
        reg.addEventListener('updatefound', () => {
          const worker = reg.installing;
          if (worker) {
            worker.addEventListener('statechange', () => {
              if (worker.state === 'installed' && navigator.serviceWorker.controller) {
                setShow(true);
              }
            });
          }
        });
      });
    }
  }, []);

  if (!show) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 flex items-end justify-center z-[100] pointer-events-none px-4 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="bg-[#111827]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl w-full max-w-sm pointer-events-auto relative"
        >
          <button onClick={() => setShow(false)} className="absolute top-3 right-3 p-1 hover:bg-white/10 rounded-full transition">
            <X size={16} className="text-slate-400" />
          </button>
          
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <svg className="w-5 h-5 animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Nueva versión disponible 🚀</h3>
              <p className="text-slate-400 text-sm mt-0.5">Mejoras listas</p>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-3 mb-4 border border-white/5">
            <p className="text-slate-300 text-sm leading-relaxed">
              Hemos optimizado el módulo de <strong className="text-white">Rentabilidad</strong> para permitir agregar y editar cuentas. También mejoramos la velocidad de carga y corregimos detalles visuales.
            </p>
          </div>

          <button 
            onClick={() => window.location.reload()} 
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
          >
            Actualizar ahora
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}