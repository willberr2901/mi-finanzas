import { useState, useEffect } from 'react';

export default function AnimatedSplash({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 300);
          return 100;
        }
        return prev + 2;
      });
    }, 40);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center gap-8 animate-fade-in">
      <div className="relative">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-400 to-cyan-500 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.4)] animate-pulse-slow">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <div className="absolute -inset-4 border border-emerald-500/20 rounded-3xl animate-ping-slow" />
      </div>

      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
          Mi Finanzas
        </h1>
        <p className="text-sm text-slate-500">Optimizando tu experiencia</p>
      </div>

      <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-emerald-400 to-cyan-500 rounded-full transition-all duration-200 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <button 
        onClick={onComplete}
        className="text-xs text-slate-500 hover:text-emerald-400 transition-colors mt-4"
      >
        Omitir
      </button>
    </div>
  );
}