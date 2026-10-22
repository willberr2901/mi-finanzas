/**
 * ════════════════════════════════════════════════════════════════════
 * 💬 VENTANA "¿QUÉ TAL TE HA PARECIDO?" (opinión del usuario)
 * ────────────────────────────────────────────────────────────────────
 * Paso 1: estrellas (1 a 5). Paso 2: qué le gusta, qué mejoraría, en qué parte
 * y un apodo opcional. Paso 3: gracias (+ invitación a Instagram si dio 4-5).
 * Se abre sola cada vez que abren la app hasta que respondan (reglas en
 * feedbackService.ts → shouldAskFeedback), o con openFeedback()
 * (Menú ☰ → "Danos tu opinión" y Ajustes). Montada en App.tsx.
 * Lo enviado llega a Reportes → Opiniones (solo administradora).
 * ════════════════════════════════════════════════════════════════════
 */
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MessageSquareHeart, Send, X, ShieldCheck, Loader2 } from 'lucide-react';
import { AREAS, sendFeedback, shouldAskFeedback, snoozeFeedback, countUsageDay, type FeedbackArea } from '../../services/feedbackService';
import { notify } from '../../services/notificationService';
import { openInstagram, InstagramIcon, INSTAGRAM_USER } from '../social/Instagram';

const FACES = ['', 'Muy mala 😞', 'Mala 😕', 'Regular 😐', 'Buena 🙂', '¡Excelente! 🤩'];

export default function FeedbackSheet({ ready }: { ready: boolean }) {
  const [open, setOpen] = useState(false);
  const [auto, setAuto] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [rating, setRating] = useState(0);
  const [liked, setLiked] = useState('');
  const [improve, setImprove] = useState('');
  const [area, setArea] = useState<FeedbackArea>('general');
  const [alias, setAlias] = useState('');
  const [sending, setSending] = useState(false);

  const reset = () => { setStep(1); setRating(0); setLiked(''); setImprove(''); setArea('general'); setAlias(''); };
  useEffect(() => {
    countUsageDay();
    const on = () => { reset(); setAuto(false); setOpen(true); };
    window.addEventListener('mf:open-feedback', on);
    return () => window.removeEventListener('mf:open-feedback', on);
  }, []);
  // Aparece sola al abrir la app (y al volver a ella) a quien aún no ha opinado.
  // Espera a que no haya otra ventana abierta (temporada, instalar, novedades…).
  const [visits, setVisits] = useState(0);
  useEffect(() => {
    const onVis = () => { if (document.visibilityState === 'visible') setVisits(v => v + 1); };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);
  useEffect(() => {
    if (!ready || open || !shouldAskFeedback()) return;
    let tries = 0;
    let t = setTimeout(function check() {
      if (!shouldAskFeedback()) return;
      if (document.querySelector('[role="dialog"]') && tries++ < 40) { t = setTimeout(check, 3000); return; }
      if (!document.querySelector('[role="dialog"]')) { reset(); setAuto(true); setOpen(true); }
    }, 6000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, visits]);

  const close = () => { if (step < 3 && auto) snoozeFeedback(); setOpen(false); };
  const send = async () => {
    if (!rating) return;
    setSending(true);
    try { await sendFeedback({ rating, liked, improve, area, alias }); setStep(3); }
    catch { notify({ title: 'No se pudo enviar', message: 'Revisa tu conexión e inténtalo de nuevo.', type: 'error' }); }
    finally { setSending(false); }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close}>
          <motion.div role="dialog" aria-modal="true" aria-labelledby="fb-title" onClick={e => e.stopPropagation()}
            initial={{ y: 80, scale: 0.94, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 60, opacity: 0 }} transition={{ type: 'spring', damping: 22 }}
            className="theme-dark relative w-full max-w-sm max-h-[92vh] overflow-y-auto rounded-[30px] p-6 bg-gradient-to-b from-[#1D2550] via-[#121938] to-[#0B1026] border border-white/10 shadow-2xl">
            <button onClick={close} aria-label="Cerrar" className="absolute right-4 top-4 p-1.5 text-slate-400"><X size={18} /></button>

            {step === 3 ? (
              <div className="text-center py-2">
                <motion.span initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} className="mx-auto w-16 h-16 rounded-[22px] bg-brand-lime flex items-center justify-center"><MessageSquareHeart size={30} className="text-brand-ink" /></motion.span>
                <h2 id="fb-title" className="text-white text-xl font-extrabold mt-4">¡Gracias por tu opinión!</h2>
                <p className="text-slate-300 text-sm mt-1.5">La leemos con cariño y nos ayuda a mejorar la app para todos.</p>
                {rating >= 4 && (
                  <button onClick={() => { openInstagram(); setOpen(false); }} className="mt-5 w-full flex items-center gap-3 p-3 rounded-2xl bg-white/[0.06] ring-1 ring-white/10 text-left">
                    <InstagramIcon size={38} />
                    <span className="flex-1"><span className="block text-white text-sm font-bold">Síguenos en Instagram</span><span className="block text-[11px] text-slate-400">@{INSTAGRAM_USER}</span></span>
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="mt-3 w-full h-12 rounded-2xl bg-brand-lime text-brand-ink font-extrabold">Listo</button>
              </div>
            ) : (
              <>
                <div className="text-center">
                  <span className="mx-auto w-14 h-14 rounded-[20px] bg-brand-lime flex items-center justify-center"><MessageSquareHeart size={26} className="text-brand-ink" /></span>
                  <h2 id="fb-title" className="text-white text-xl font-extrabold mt-3">{step === 1 ? '¿Qué tal te ha parecido Mi Finanzas?' : 'Cuéntanos un poco más'}</h2>
                  {step === 1 && <p className="text-slate-300 text-sm mt-1">Te toma menos de 1 minuto, es anónima y con tus ideas decidimos qué mejorar 💚</p>}
                </div>

                {/* Estrellas */}
                <div className="flex justify-center gap-1.5 mt-4" role="radiogroup" aria-label="Calificación">
                  {[1, 2, 3, 4, 5].map(n => (
                    <motion.button key={n} whileTap={{ scale: 0.8 }} role="radio" aria-checked={rating === n} aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`}
                      onClick={() => { setRating(n); if (step === 1) setTimeout(() => setStep(2), 350); }}>
                      <motion.span animate={{ scale: rating >= n ? [1, 1.25, 1] : 1 }} className="block">
                        <Star size={step === 1 ? 40 : 30} className={rating >= n ? 'text-brand-lime' : 'text-white/25'} fill={rating >= n ? 'currentColor' : 'none'} strokeWidth={1.8} />
                      </motion.span>
                    </motion.button>
                  ))}
                </div>
                <p className="text-center text-sm font-bold text-brand-lime h-5 mt-1">{FACES[rating]}</p>

                {step === 2 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-3 space-y-3">
                    <label className="block text-[12px] text-slate-300 font-semibold">¿Qué es lo que más te gusta?
                      <textarea value={liked} onChange={e => setLiked(e.target.value)} maxLength={1000} rows={2} placeholder="Ej: la lista del mercado y los avisos de pagos"
                        className="mt-1 w-full p-3 rounded-2xl bg-white/[0.06] border border-white/10 text-white text-sm outline-none focus:border-brand-lime resize-none" />
                    </label>
                    <label className="block text-[12px] text-slate-300 font-semibold">{rating <= 3 ? '¿Qué deberíamos mejorar?' : '¿Qué cambiarías o agregarías?'}
                      <textarea value={improve} onChange={e => setImprove(e.target.value)} maxLength={1000} rows={3} placeholder="Ej: el reporte en Excel, poder…"
                        className="mt-1 w-full p-3 rounded-2xl bg-white/[0.06] border border-white/10 text-white text-sm outline-none focus:border-brand-lime resize-none" />
                    </label>
                    <div>
                      <p className="text-[12px] text-slate-300 font-semibold mb-1.5">¿Sobre qué parte de la app?</p>
                      <div className="flex flex-wrap gap-1.5">
                        {AREAS.map(a => (
                          <button key={a.id} onClick={() => setArea(a.id)} className={`px-3 py-1.5 rounded-full text-xs font-bold ${area === a.id ? 'bg-brand-lime text-brand-ink' : 'bg-white/[0.07] text-slate-200 ring-1 ring-white/10'}`}>{a.label}</button>
                        ))}
                      </div>
                    </div>
                    <label className="block text-[12px] text-slate-300 font-semibold">Tu nombre o apodo <span className="text-slate-500 font-normal">(opcional)</span>
                      <input value={alias} onChange={e => setAlias(e.target.value)} maxLength={40} placeholder="Déjalo vacío para que sea anónimo"
                        className="mt-1 w-full h-11 px-3 rounded-xl bg-white/[0.06] border border-white/10 text-white text-sm outline-none focus:border-brand-lime" />
                    </label>
                    <p className="text-[11px] text-slate-400 flex gap-1.5"><ShieldCheck size={13} className="text-brand-lime shrink-0 mt-0.5" />Solo se envía lo que escribes aquí. No incluyas datos personales (teléfono, cédula, cuentas).</p>
                    <button onClick={send} disabled={sending} className="w-full h-13 py-3.5 rounded-2xl bg-brand-lime text-brand-ink font-extrabold flex items-center justify-center gap-2 disabled:opacity-60">
                      {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />} Enviar opinión
                    </button>
                  </motion.div>
                )}
                {step === 1 && <button onClick={close} className="mt-4 w-full text-sm text-slate-400 font-semibold">Ahora no</button>}
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
