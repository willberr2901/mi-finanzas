/**
 * ════════════════════════════════════════════════════════════════════
 * 👋 BIENVENIDA
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: Pantalla animada de bienvenida (una vez por sesión) y el primer recorrido.
 * Dónde se ve: Al abrir la app.
 * Si lo cambias: Si se traba, la app no pasa de la bienvenida.
 * ════════════════════════════════════════════════════════════════════
 */
import { useEffect, useState } from 'react';
import Kai from '../assistant/Kai';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
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


/** Monedas que suben detrás de Kai en el saludo. */
const COINS = Array.from({ length: 9 }, (_, i) => ({ x: (i * 37 + 8) % 92, s: 10 + ((i * 7) % 10), d: (i % 5) * 0.12 }));
/** "Hoy puedes gastar…" que dejó el Inicio la última vez (solo si es de hoy). */
const todayFact = (): string | null => {
  try {
    const v = JSON.parse(localStorage.getItem('mf_hoy') || 'null');
    const d = new Date(); const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    return v && v.d === key && v.t ? v.t : null;
  } catch { return null; }
};

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
    const t = setTimeout(onDone, 2900);
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
    const today = todayFact();
    // ✨ Kai llega volando con estela y monedas, saluda, da el dato del día y se va a su esquina del Inicio
    return (
      <motion.div className="theme-dark fixed inset-0 z-[160] bg-appbg flex flex-col items-center justify-center text-center px-8 overflow-hidden" onClick={onDone}
        initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.45 }}>
        <Backdrop />
        {COINS.map((c, i) => (
          <motion.span key={i} aria-hidden="true" className="absolute rounded-full" style={{ left: `${c.x}%`, width: c.s, height: c.s, background: 'radial-gradient(circle at 35% 30%,#FDE68A,#D4A017)', boxShadow: '0 0 10px rgba(251,191,36,.5)' }}
            initial={{ y: '110vh', opacity: 0 }} animate={{ y: '-15vh', opacity: [0, 1, 1, 0] }} transition={{ duration: 2.2, delay: c.d, ease: 'easeOut' }} />
        ))}
        <motion.div className="relative" initial={{ y: 420, rotate: -12, scale: 0.8 }} animate={{ y: 0, rotate: 0, scale: 1 }}
          exit={{ x: 150, y: -330, scale: 0.25, opacity: 0 }} transition={{ type: 'spring', damping: 13, stiffness: 110 }}>
          <motion.span aria-hidden="true" className="absolute left-1/2 -translate-x-1/2 top-[85%] w-8 rounded-full blur-md" style={{ background: 'linear-gradient(#C6F432,transparent)' }}
            initial={{ height: 140, opacity: 0.9 }} animate={{ height: 0, opacity: 0 }} transition={{ duration: 0.9, delay: 0.35 }} />
          <Kai mood="feliz" size={150} title="Kai" />
        </motion.div>
        <motion.p className="relative mt-3 rounded-2xl bg-[#fff] text-[#0B1026] px-4 py-2.5 font-extrabold text-[15px] shadow-xl shadow-black/40"
          initial={{ opacity: 0, scale: 0.7, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: 0.55, type: 'spring', damping: 14 }}>
          👋 ¡{greet}{savedName ? <>, <span className="text-[#4D7C0F]">{savedName}</span></> : ''}!
        </motion.p>
        {today && (
          <motion.div className="relative mt-4 rounded-[22px] px-5 py-3 bg-[#121938] ring-1 ring-brand-lime/40" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.05 }}>
            <p className="text-[10.5px] font-extrabold tracking-[.14em] text-slate-400">HOY PUEDES GASTAR</p>
            <p className="text-[30px] font-extrabold text-brand-lime leading-tight drop-shadow-[0_0_14px_rgba(198,244,50,.4)]">{today}</p>
          </motion.div>
        )}
        <motion.p className="relative text-slate-500 mt-6 text-xs font-semibold" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}>Toca para entrar</motion.p>
      </motion.div>
    );
  }

  return (
    <motion.div className="theme-dark fixed inset-0 z-[160] bg-appbg flex flex-col items-center justify-center px-7" exit={{ opacity: 0 }}>
      <Backdrop />
      <AnimatePresence mode="wait">
        {step === 'intro' && (
          <motion.div key="intro" className="relative flex flex-col items-center text-center" exit={{ opacity: 0, y: -20 }}>
            {/* 🤖 Kai "arranca": se enciende mientras su anillo se llena */}
            <div className="relative w-[200px] h-[200px] flex items-center justify-center">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="92" stroke="rgba(255,255,255,.08)" strokeWidth="7" fill="none" />
                <motion.circle cx="100" cy="100" r="92" stroke="#C6F432" strokeWidth="7" fill="none" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 8px #C6F432)' }}
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.3, ease: 'easeInOut' }} /></svg>
              <motion.div initial={{ filter: 'brightness(.3) saturate(0)', scale: 0.85 }} animate={{ filter: 'brightness(1) saturate(1)', scale: 1 }} transition={{ duration: 1.2 }}>
                <Kai mood="celebra" size={140} title="Kai" />
              </motion.div>
            </div>
            <motion.p className="mt-3 rounded-2xl bg-[#fff] text-[#0B1026] px-4 py-2 font-extrabold text-[15px]" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.2, type: 'spring', damping: 14 }}>¡Hola! Soy Kai 👋 Te ayudo con tu plata</motion.p>
            <motion.p className="text-slate-300 mt-5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>Te damos la bienvenida a</motion.p>
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
