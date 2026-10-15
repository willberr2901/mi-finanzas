import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import AppLogo from '../ui/AppLogo';
import { MODULES } from '../../utils/modules';

const APP_NAME = 'Mi Finanzas';

const TOUR: { key: keyof typeof MODULES; text: string }[] = [
  { key: 'mercado', text: 'Haz tu lista, mira en vivo cuánto llevas y te avisamos si algo subió de precio.' },
  { key: 'finanzas', text: 'Registra lo que entra y sale. Cada gasto se clasifica solo: obligatorios, necesarios, gustos o ahorro.' },
  { key: 'pagos', text: 'Arriendo, servicios y deudas en un calendario, con avisos antes de cada vencimiento.' },
  { key: 'legal', text: 'Sin registro y sin servidores: todo lo que anotes se queda solo en tu celular.' },
];

/** Letras que aparecen una por una. */
const Letters = ({ text, delay = 0, className = '' }: { text: string; delay?: number; className?: string }) => (
  <span className={className} aria-label={text}>
    {text.split('').map((ch, i) => (
      <motion.span key={i} aria-hidden="true" className="inline-block" initial={{ opacity: 0, y: 18, rotateX: 90 }} animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ delay: delay + i * 0.045, type: 'spring', damping: 14, stiffness: 200 }}>{ch === ' ' ? ' ' : ch}</motion.span>
    ))}
  </span>
);

const Backdrop = () => (
  <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
    <motion.div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-violet-600/30 blur-3xl" animate={{ x: [0, 40, 0], y: [0, 30, 0] }} transition={{ duration: 9, repeat: Infinity }} />
    <motion.div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-cyan-500/25 blur-3xl" animate={{ x: [0, -30, 0], y: [0, -40, 0] }} transition={{ duration: 11, repeat: Infinity }} />
  </div>
);

/**
 * Primera vez: bienvenida animada → nombre (opcional) → recorrido por los módulos.
 * Las siguientes veces: un saludo corto de "qué bueno verte de nuevo".
 */
export default function WelcomeExperience({ firstTime, onDone }: { firstTime: boolean; onDone: () => void }) {
  const [step, setStep] = useState<'intro' | 'name' | 'tour'>('intro');
  const [slide, setSlide] = useState(0);
  const [name, setName] = useState('');
  const savedName = localStorage.getItem('miFinanzasUserName');

  // Regreso: saludo breve que se cierra solo.
  useEffect(() => {
    if (firstTime) return;
    const t = setTimeout(onDone, 2400);
    return () => clearTimeout(t);
  }, [firstTime, onDone]);

  const finish = () => {
    localStorage.setItem('miFinanzasWelcomeDone', 'true');
    localStorage.setItem('miFinanzasTutorialSeen', 'true');
    onDone();
  };

  if (!firstTime) {
    const hour = new Date().getHours();
    const greet = hour < 5 ? 'Buenas noches' : hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
    return (
      <motion.div className="fixed inset-0 z-[160] bg-[#070B14] flex flex-col items-center justify-center text-center px-8" onClick={onDone}
        initial={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.04 }} transition={{ duration: 0.4 }}>
        <Backdrop />
        <motion.div initial={{ scale: 0.4, rotate: -20, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: 'spring', damping: 11, stiffness: 160 }}>
          <AppLogo size={88} />
        </motion.div>
        <motion.p className="relative text-slate-400 mt-6 text-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>{greet}</motion.p>
        <motion.h1 className="relative text-white text-3xl font-extrabold mt-1 leading-tight" initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ delay: 0.35, duration: 0.6 }}>
          {savedName ? <>¡Hola de nuevo,<br /><span className="bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-transparent">{savedName}!</span></> : '¡Qué bueno verte de nuevo!'}
        </motion.h1>
        <motion.p className="relative text-violet-300 mt-2 font-medium" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}>{APP_NAME}</motion.p>
      </motion.div>
    );
  }

  return (
    <motion.div className="fixed inset-0 z-[160] bg-[#070B14] flex flex-col items-center justify-center px-7" exit={{ opacity: 0 }}>
      <Backdrop />
      <AnimatePresence mode="wait">
        {step === 'intro' && (
          <motion.div key="intro" className="relative flex flex-col items-center text-center" exit={{ opacity: 0, y: -20 }}>
            <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', damping: 10, stiffness: 120 }}>
              <AppLogo size={108} />
            </motion.div>
            <motion.p className="text-slate-300 mt-8" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>Te damos la bienvenida a</motion.p>
            <h1 className="text-white text-4xl font-extrabold mt-1 tracking-tight"><Letters text={APP_NAME} delay={0.7} /></h1>
            <motion.p className="text-slate-400 mt-3 max-w-xs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}>
              El mercado, los pagos y las cuentas de tu hogar, claros y en un solo lugar.
            </motion.p>
            <motion.button onClick={() => setStep('name')} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.7 }}
              className="mt-10 px-10 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 text-brand-ink font-bold text-lg shadow-xl shadow-violet-600/40 flex items-center gap-2 active:scale-95">
              Empezar <ArrowRight size={20} />
            </motion.button>
          </motion.div>
        )}

        {step === 'name' && (
          <motion.div key="name" className="relative w-full max-w-sm text-center" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <motion.div className="text-5xl" animate={{ rotate: [0, 18, -8, 18, 0] }} transition={{ duration: 1.4, delay: 0.2 }}>👋</motion.div>
            <h2 className="text-white text-2xl font-bold mt-4">¿Cómo quieres que te llamemos?</h2>
            <p className="text-slate-400 text-sm mt-1">Es opcional y queda solo en tu celular.</p>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre o apodo" autoFocus maxLength={24}
              onKeyDown={e => { if (e.key === 'Enter') { if (name.trim()) localStorage.setItem('miFinanzasUserName', name.trim()); setStep('tour'); } }}
              className="mt-6 w-full p-4 bg-white/5 border border-white/15 rounded-2xl text-white text-center text-lg outline-none focus:border-violet-400" />
            <button onClick={() => { if (name.trim()) localStorage.setItem('miFinanzasUserName', name.trim()); setStep('tour'); }}
              className="mt-4 w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 text-brand-ink font-bold">{name.trim() ? `Mucho gusto, ${name.trim()}` : 'Continuar'}</button>
            <button onClick={() => setStep('tour')} className="mt-2 text-slate-400 text-sm py-2">Saltar</button>
          </motion.div>
        )}

        {step === 'tour' && (
          <motion.div key={`tour-${slide}`} className="relative w-full max-w-sm text-center" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
            {(() => {
              const m = MODULES[TOUR[slide].key]; const Icon = m.icon;
              return (
                <>
                  <motion.div initial={{ scale: 0.3, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', damping: 10 }}
                    className={`w-28 h-28 mx-auto rounded-[32px] bg-gradient-to-br ${m.gradient} flex items-center justify-center shadow-2xl ${m.glow}`}>
                    <Icon size={52} className="text-brand-lime" />
                  </motion.div>
                  <p className={`mt-8 text-xs uppercase tracking-[0.2em] font-bold ${m.accent}`}>{m.label}</p>
                  <h2 className="text-white text-2xl font-bold mt-1">{m.tagline}</h2>
                  <p className="text-slate-300 mt-3 leading-relaxed">{TOUR[slide].text}</p>
                </>
              );
            })()}
            <div className="flex justify-center gap-2 mt-8" aria-hidden="true">
              {TOUR.map((_, i) => <span key={i} className={`h-2 rounded-full transition-all ${i === slide ? 'w-6 bg-white' : 'w-2 bg-white/25'}`} />)}
            </div>
            <button onClick={() => (slide < TOUR.length - 1 ? setSlide(s => s + 1) : finish())}
              className="mt-8 w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 text-brand-ink font-bold flex items-center justify-center gap-2">
              {slide < TOUR.length - 1 ? 'Siguiente' : '¡Vamos!'} <ArrowRight size={18} />
            </button>
            {slide < TOUR.length - 1 && <button onClick={finish} className="mt-2 text-slate-400 text-sm py-2">Saltar recorrido</button>}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
