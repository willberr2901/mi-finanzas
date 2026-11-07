/**
 * ════════════════════════════════════════════════════════════════════
 * 🤖 KAI FLOTANDO EN LA ESQUINA (Inicio)
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: Kai pequeño arriba a la derecha con una burbuja que te habla
 *   ("¡Vas bien hoy! 💚", "Hoy te pagan", "Ojo con Salidas"…).
 *   • Tocar: si no hay plan abre el asistente; si hay, muestra el siguiente consejo
 *     (y si el consejo tiene acción, la burbuja la lleva a cabo).
 *   • Dejar presionado: cambia el color de Kai (blanco ↔ negro).
 * Liviano: Kai mini no lleva brillos borrosos y flota con la tarjeta gráfica.
 * ════════════════════════════════════════════════════════════════════
 */
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Kai, { type KaiMood } from './Kai';
import { getKaiColor, setKaiColor } from '../../services/kaiPrefs';
import { haptic } from '../../utils/haptics';
import { notify } from '../../services/notificationService';

export interface KaiTip { text: string; mood: KaiMood; action?: () => void }

/** restMood/badge: cómo está Kai cuando no habla (reacciona a tu plata: 🎉 día de pago, 💧 cerca del límite, 😴 de noche, 🔥 racha). */
export default function FloatingKai({ tips, onTap, restMood = 'feliz', badge }: { tips: KaiTip[]; onTap?: () => void; restMood?: KaiMood; badge?: string }) {
  const [i, setI] = useState(0);
  const [show, setShow] = useState(false);
  const press = useRef<number>();
  const long = useRef(false);
  const hide = useRef<number>();
  const tip = tips.length ? tips[i % tips.length] : null;

  const pop = (ms = 4500) => { setShow(true); window.clearTimeout(hide.current); hide.current = window.setTimeout(() => setShow(false), ms); };
  // Saluda un momento después de abrir Inicio
  useEffect(() => { const t = window.setTimeout(() => pop(), 900); return () => { window.clearTimeout(t); window.clearTimeout(hide.current); }; }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const down = () => {
    long.current = false;
    press.current = window.setTimeout(() => {
      long.current = true;
      const next = getKaiColor() === 'blanco' ? 'negro' : 'blanco';
      setKaiColor(next); haptic('success');
      notify({ title: next === 'negro' ? 'Kai ahora es negro ⚫' : 'Kai ahora es blanco ⚪', message: 'Déjalo presionado para cambiarlo otra vez.', type: 'success', log: false });
    }, 600);
  };
  const up = () => window.clearTimeout(press.current);
  const click = () => {
    if (long.current) return;
    haptic('light');
    if (onTap && !tips.length) { onTap(); return; }
    if (show && tip?.action) { tip.action(); setShow(false); return; }
    if (show) setI(x => x + 1);
    pop();
  };

  return (
    <div className="relative shrink-0 -my-3 -mx-1.5">
      <button onPointerDown={down} onPointerUp={up} onPointerLeave={up} onContextMenu={e => e.preventDefault()} onClick={click}
        aria-label="Kai, tu asistente. Toca para un consejo; deja presionado para cambiar su color" className="block select-none [-webkit-touch-callout:none]">
        <Kai mood={show && tip ? tip.mood : restMood} size={52} />
        {badge && <motion.span key={badge} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 10 }} className="absolute -bottom-0.5 -left-1 min-w-[22px] h-[22px] px-1 rounded-full bg-[#0B1026] ring-2 ring-brand-lime/60 text-[11px] font-extrabold text-white flex items-center justify-center" aria-hidden="true">{badge}</motion.span>}
      </button>
      <AnimatePresence>
        {show && tip && (
          <motion.button key={i % Math.max(1, tips.length)} onClick={click} initial={{ opacity: 0, y: -6, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="absolute right-4 top-[56px] z-30 w-max max-w-[200px] text-left rounded-[16px_4px_16px_16px] bg-[#fff] text-[#0B1026] text-[12.5px] font-bold leading-snug px-3 py-2 shadow-xl shadow-black/50">
            {tip.text}{tip.action && <span className="block text-[11px] text-[#4D7C0F] font-extrabold mt-0.5">Tócame ›</span>}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
