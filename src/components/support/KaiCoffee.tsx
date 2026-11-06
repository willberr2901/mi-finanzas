/**
 * ☕ KAI CON SU TINTICO (para la ventana Apóyanos)
 * Kai + una taza con vapor en la mano y un globo con lo que dice.
 */
import { motion, AnimatePresence } from 'framer-motion';
import Kai, { type KaiMood } from '../assistant/Kai';

export function Cup({ size = 44 }: { size?: number }) {
  return (
    <span className="relative inline-block" style={{ width: size, height: size * 0.9 }} aria-hidden="true">
      {[0, 1, 2].map(i => (
        <motion.span key={i} className="absolute w-1 rounded-full bg-white/80" style={{ left: size * (0.2 + i * 0.18), top: -size * 0.45, height: size * 0.4 }}
          animate={{ y: [4, -6], opacity: [0, 0.9, 0] }} transition={{ duration: 1.8, delay: i * 0.45, repeat: Infinity }} />
      ))}
      <svg width={size} height={size * 0.9} viewBox="0 0 60 54">
        <path d="M4 6 h40 l-4 38 a8 8 0 0 1 -8 7 h-16 a8 8 0 0 1 -8 -7z" fill="#fff" stroke="#E2E8F0" strokeWidth="2" />
        <path d="M6 14 h36 l-3 28 h-30z" fill="#7C3F1D" opacity=".9" />
        <path d="M44 14 q14 2 12 14 q-2 10 -14 10" stroke="#fff" strokeWidth="5" fill="none" />
        <path d="M18 26 c0 -4 6 -5 6 -1 c0 -4 6 -3 6 1 c0 4 -6 7 -6 9 c0 -2 -6 -5 -6 -9z" fill="#C6F432" />
      </svg>
    </span>
  );
}

export function KaiSays({ text, k }: { text: string; k: string | number }) {
  return (
    <div className="relative mx-auto max-w-[300px]">
      <span aria-hidden="true" className="absolute -top-2 left-1/2 -ml-2 border-8 border-transparent border-t-0 border-b-white" />
      <AnimatePresence mode="wait">
        <motion.p key={k} role="status" initial={{ opacity: 0, y: 6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}
          className="rounded-2xl bg-white text-[#0B1026] px-4 py-2.5 text-[13.5px] font-bold leading-snug text-center">{text}</motion.p>
      </AnimatePresence>
    </div>
  );
}

/** Kai sosteniendo el tintico (celebra = sin taza, brazos arriba). */
export default function KaiCoffee({ mood, size = 140 }: { mood: KaiMood; size?: number }) {
  return (
    <div className="relative" style={{ width: size, height: size * 1.1 }}>
      <Kai mood={mood} size={size} title="Kai" />
      <AnimatePresence>
        {mood !== 'celebra' && (
          <motion.span key="cup" className="absolute" style={{ right: -size * 0.28, bottom: size * 0.2 }}
            initial={{ opacity: 0, scale: 0.4, rotate: -20 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} exit={{ opacity: 0, scale: 0.4, y: -20 }} transition={{ type: 'spring', damping: 14 }}>
            <Cup size={size * 0.32} />
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
