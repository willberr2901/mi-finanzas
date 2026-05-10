import { usePwaUpdate } from '../../hooks/usePwaUpdate';
import Button from './Button';

export default function PwaUpdateBanner() {
  const { needRefresh, update } = usePwaUpdate();
  
  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm animate-slide-up">
      <div className="bg-[#111827] border border-violet-500/30 rounded-3xl p-4 shadow-2xl backdrop-blur-xl">
        <p className="text-white font-semibold">🚀 Nueva versión disponible</p>
        <p className="text-slate-400 text-sm mt-1">Mejoras de rendimiento y seguridad.</p>
        <div className="mt-3 flex gap-2">
          <Button onClick={update} variant="primary" className="flex-1 py-3">
            Actualizar ahora
          </Button>
          <Button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} variant="ghost" className="flex-1 py-3">
            Más tarde
          </Button>
        </div>
      </div>
    </div>
  );
}