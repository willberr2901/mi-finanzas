/**
 * ════════════════════════════════════════════════════════════════════
 * ⭐ "¿CÓMO TE PARECE MI FINANZAS?" (popup de calificación con Kai)
 * ────────────────────────────────────────────────────────────────────
 * Paso 1: 5 estrellas grandes; Kai cambia de cara según las estrellas.
 *         Con solo tocar una estrella la calificación ya cuenta.
 * Paso 2: 1–3 ⭐ → "¿Qué podemos mejorar?" (parte de la app + comentario).
 *         4–5 ⭐ → "¿Qué es lo que más te gusta?" (opcional).
 * Paso 3: 4–5 ⭐ → "¿Nos ayudas a crecer?": recomendar por WhatsApp o seguir en Instagram.
 *         1–3 ⭐ → "Gracias, lo vamos a mejorar".
 * Cuándo sale: ver services/ratingService.ts (momentos felices, sin insistir).
 * ════════════════════════════════════════════════════════════════════
 */
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import Kai, { type KaiMood } from '../assistant/Kai';
import { AREAS, sendFeedback, countUsageDay, type FeedbackArea } from '../../services/feedbackService';
import { shouldAskRating, markRatingShown, dismissRating, saveRating } from '../../services/ratingService';
import { shareLink } from '../../services/statsService';
import { openInstagram } from '../social/Instagram';
import { IS_TEST } from '../../utils/env';
import { haptic } from '../../utils/haptics';
import { notify } from '../../services/notificationService';

const LABELS = ['', 'No me gusta 😕', 'Le falta 🤔', 'Está bien 🙂', '¡Me gusta! 😊', '¡Me encanta! 😍'];
const moodFor = (n: number): KaiMood => (n === 0 ? 'feliz' : n <= 2 ? 'calma' : n === 3 ? 'pensando' : n === 4 ? 'feliz' : 'celebra');

function Star({ on, i, onPick }: { on: boolean; i: number; onPick: (n: number) => void }) {
  return (
    <motion.button type="button" aria-label={`${i} estrella${i > 1 ? 's' : ''}`} onClick={() => onPick(i)} whileTap={{ scale: 0.8 }}
      animate={on ? { scale: [1, 1.35, 1], rotate: [0, -12, 0] } : { scale: 1 }} transition={{ duration: 0.35, delay: on ? (i - 1) * 0.04 : 0 }}
      className="p-1">
      <svg width="44" height="44" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9z"
          fill={on ? '#FACC15' : 'rgba(255,255,255,.08)'} stroke={on ? '#F59E0B' : 'rgba(255,255,255,.25)'} strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    </motion.button>
  );
}

function Card({ auto, onClose }: { auto: boolean; onClose: () => void }) {
  const [stars, setStars] = useState(0);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [text, setText] = useState('');
  const [area, setArea] = useState<FeedbackArea>('general');
  const [sending, setSending] = useState(false);
  const sent = useRef(false);
  const high = stars >= 4;

  const submit = async (withText: boolean) => {
    if (!stars || sent.current) return;
    sent.current = true;
    saveRating(stars);
    if (IS_TEST) return; // la app de pruebas no envía nada
    try { await sendFeedback({ rating: stars, liked: high && withText ? text : '', improve: !high && withText ? text : '', area, alias: '' }); }
    catch { /* sin conexión: la calificación queda guardada en el celular */ }
  };
  const pick = (n: number) => { setStars(n); haptic(n >= 4 ? 'success' : 'light'); };
  const close = () => {
    if (stars && !sent.current) submit(false);       // tocar una estrella ya cuenta
    else if (!stars && auto) dismissRating();
    onClose();
  };
  const next = async () => {
    if (step === 1) { setStep(2); return; }
    setSending(true);
    await submit(true);
    setSending(false);
    if (IS_TEST) notify({ title: 'App de pruebas', message: `Calificación de ${stars} ⭐ (no se envía desde pruebas).`, type: 'info', log: false });
    setStep(3);
  };
  const recommend = () => {
    const msg = `Estoy usando Mi Finanzas para organizar la plata de la casa 💚 Es gratis y tus datos se quedan en tu celular: ${shareLink()}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
  };

  const mood: KaiMood = step === 3 ? (high ? 'celebra' : 'calma') : moodFor(stars);
  const strip = high ? 'from-yellow-200 via-lime-200 to-emerald-300' : stars && stars <= 2 ? 'from-sky-200 via-indigo-200 to-violet-300' : 'from-yellow-200 via-amber-200 to-orange-300';

  return (
    <motion.div className="fixed inset-0 z-[172] bg-black/75 backdrop-blur-sm flex items-center justify-center p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div role="dialog" aria-modal="true" aria-labelledby="rate-title" initial={{ y: -50, scale: 0.9, opacity: 0, rotate: -2 }} animate={{ y: 0, scale: 1, opacity: 1, rotate: 0 }} exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 17, stiffness: 240 }} className="theme-dark relative w-full max-w-sm overflow-hidden rounded-[30px] bg-[#121938] border border-white/10 shadow-2xl shadow-black/60 text-white">
        <div className={`relative px-5 pt-4 pb-[72px] bg-gradient-to-br transition-colors duration-500 ${strip}`}>
          <div aria-hidden="true" className="pointer-events-none absolute -right-6 -top-8 w-32 h-32 rounded-full bg-white/30 blur-2xl" />
          <div className="relative z-10 flex items-center justify-between">
            <p className="text-[11px] font-extrabold tracking-widest text-[#0B1026]">⭐ TU OPINIÓN NOS AYUDA</p>
            <button onClick={close} aria-label="Cerrar" className="p-1 text-[#0B1026]/70"><X size={18} /></button>
          </div>
        </div>
        <div className="relative z-10 -mt-[70px] flex justify-center"><Kai mood={mood} size={112} /></div>

        <div className="px-5 pb-5 text-center">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <h2 id="rate-title" className="text-[19px] font-extrabold">¿Cómo te parece Mi Finanzas?</h2>
                <div className="flex justify-center mt-2" role="radiogroup" aria-label="Calificación">
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} i={i} on={i <= stars} onPick={pick} />)}
                </div>
                <p className={`text-[14px] font-bold h-5 ${stars ? 'text-yellow-300' : 'text-slate-400'}`}>{stars ? LABELS[stars] : 'Toca las estrellas'}</p>
                <motion.button whileTap={{ scale: 0.97 }} disabled={!stars} onClick={next} className="mt-4 w-full py-3.5 rounded-2xl font-extrabold bg-brand-lime text-brand-ink disabled:opacity-40">Continuar</motion.button>
                <button onClick={close} className="mt-2 w-full h-11 rounded-2xl text-slate-300 font-bold">{stars ? 'Solo las estrellas' : 'Ahora no'}</button>
              </motion.div>
            )}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <h2 id="rate-title" className="text-[18px] font-extrabold">{high ? '¡Gracias! 💚 ¿Qué es lo que más te gusta?' : '¿Qué podemos mejorar?'}</h2>
                <p className="text-[12.5px] text-slate-300 mt-1">{high ? 'Opcional, pero nos alegra el día.' : 'Cuéntanos sin pena: lo leemos todo.'}</p>
                {!high && (
                  <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                    {AREAS.map(a => (
                      <button key={a.id} onClick={() => setArea(a.id)} aria-pressed={area === a.id}
                        className={`px-3 py-1.5 rounded-full text-[12px] font-bold ring-1 ${area === a.id ? 'bg-brand-lime text-brand-ink ring-brand-lime' : 'bg-white/[0.05] ring-white/10'}`}>{a.label}</button>
                    ))}
                  </div>
                )}
                <textarea value={text} onChange={e => setText(e.target.value.slice(0, 1000))} rows={3} placeholder={high ? 'Ej: Kai, el mercado, los anillos…' : 'Ej: me gustaría que…'}
                  aria-label={high ? 'Lo que más te gusta' : 'Qué mejorarías'}
                  className="mt-3 w-full rounded-2xl bg-[#0B1026] ring-1 ring-white/10 focus:ring-brand-lime outline-none px-3.5 py-3 text-[14px] text-left resize-none" />
                <motion.button whileTap={{ scale: 0.97 }} disabled={sending} onClick={next} className="mt-3 w-full py-3.5 rounded-2xl font-extrabold bg-brand-lime text-brand-ink disabled:opacity-50">{sending ? 'Enviando…' : 'Enviar'}</motion.button>
                <p className="text-[10.5px] text-slate-500 mt-2">Sin datos de tus finanzas: solo tu opinión.</p>
              </motion.div>
            )}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <h2 id="rate-title" className="text-[19px] font-extrabold">{high ? '¿Nos ayudas a crecer? 🚀' : 'Gracias, lo vamos a mejorar 💚'}</h2>
                <p className="text-[13px] text-slate-300 mt-1.5">{high ? 'Somos una app pequeña y gratis. Si se la recomiendas a alguien, nos ayudas muchísimo.' : 'Cada opinión nos dice qué arreglar primero. Pronto verás los cambios en Novedades.'}</p>
                {high ? (
                  <div className="mt-4 space-y-2">
                    <motion.button whileTap={{ scale: 0.97 }} onClick={recommend} className="w-full py-3.5 rounded-2xl font-extrabold bg-gradient-to-r from-lime-200 to-emerald-400 text-[#05231A]">💬 Recomendar por WhatsApp</motion.button>
                    <button onClick={() => { openInstagram(); }} className="w-full py-3 rounded-2xl font-extrabold bg-gradient-to-r from-fuchsia-300 via-rose-300 to-amber-300 text-[#2A0A1F]">📸 Seguirnos en Instagram</button>
                    <button onClick={onClose} className="w-full h-11 rounded-2xl text-slate-300 font-bold">Listo</button>
                  </div>
                ) : <button onClick={onClose} className="mt-4 w-full py-3.5 rounded-2xl font-extrabold bg-brand-lime text-brand-ink">Listo</button>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

/** Va en App.tsx: escucha los momentos felices y la apertura manual. */
export default function RatingHost({ ready }: { ready: boolean }) {
  const [open, setOpen] = useState<null | { auto: boolean }>(null);
  useEffect(() => {
    countUsageDay();
    const manual = () => setOpen({ auto: false });
    const happy = () => {
      if (!ready || !shouldAskRating()) return;
      // Deja ver primero el "¡listo!" de lo que acaba de hacer, y no sale encima de otra ventana
      setTimeout(() => {
        if (document.querySelector('[role="dialog"]') || !shouldAskRating()) return;
        markRatingShown(); setOpen({ auto: true });
      }, 2200);
    };
    window.addEventListener('mf:open-rating', manual);
    window.addEventListener('mf:happy', happy);
    return () => { window.removeEventListener('mf:open-rating', manual); window.removeEventListener('mf:happy', happy); };
  }, [ready]);
  return createPortal(<AnimatePresence>{open && <Card auto={open.auto} onClose={() => setOpen(null)} />}</AnimatePresence>, document.body);
}
