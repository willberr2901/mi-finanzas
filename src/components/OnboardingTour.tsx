import { useState, useEffect } from 'react';
import { X, ArrowRight, CheckCircle } from 'lucide-react';
import { db } from '../utils/database';

interface OnboardingTourProps {
  onComplete: () => void;
}

const STEPS = [
  { title: '💰 Registra tus movimientos', desc: 'Controla ingresos y gastos con categorías inteligentes.' },
  { title: '🎯 Crea metas de ahorro', desc: 'Visualiza tu progreso y cuánto necesitas ahorrar al día.' },
  { title: '🔔 Activa alertas', desc: 'Recibe recordatorios diarios para no perder el control.' }
];

export default function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const markComplete = async () => {
      try {
        await db.settings.update('global', { onboardingCompleted: true });
      } catch {
        // Ignorar si ya está actualizado o si no existe el registro aún
      }
    };
    markComplete();
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 w-full max-w-sm rounded-2xl p-6 border border-emerald-500/30 shadow-2xl">
        <div className="flex justify-between items-start mb-4">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle className="text-emerald-400" size={20} />
          </div>
          <button onClick={onComplete} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <h2 className="text-xl font-bold text-white mb-2">{STEPS[step].title}</h2>
        <p className="text-slate-300 mb-6">{STEPS[step].desc}</p>
        
        <div className="flex gap-2 mb-6">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= step ? 'bg-emerald-500' : 'bg-slate-700'}`} />
          ))}
        </div>

        <button 
          onClick={() => step === STEPS.length - 1 ? onComplete() : setStep(s => s + 1)} 
          className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          {step === STEPS.length - 1 ? '¡Comenzar!' : 'Siguiente'} <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}