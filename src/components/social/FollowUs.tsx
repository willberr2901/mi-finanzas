/**
 * ════════════════════════════════════════════════════════════════════
 * 📣 "SÍGUENOS": INSTAGRAM Y DESPUÉS EL CANAL DE WHATSAPP
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: dos tarjetas seguidas (mismo diseño que los avisos de préstamos):
 *   1/2 Instagram @mifinanzas_app  →  2/2 Canal de WhatsApp.
 * Cuándo sale:
 *   • desde la 3.ª vez que se abre la app, y solo si en ese momento no hay
 *     otra ventana (novedades, encuesta, préstamos…): nunca dos avisos seguidos.
 *   • si toca "Ahora no" en las dos, vuelve a preguntar en 14 días (máximo 3 veces).
 *   • si toca "Seguir" o "Unirme", no vuelve a preguntar por esa red.
 * Datos: solo en el celular (localStorage 'mf_follow'). La app no sabe si de verdad
 *        siguió: solo abre Instagram o WhatsApp.
 * Íconos: dibujos de la app (no son los logos oficiales).
 * ════════════════════════════════════════════════════════════════════
 */
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Instagram, MessageCircle, X, ArrowRight } from 'lucide-react';
import { INSTAGRAM_URL, INSTAGRAM_USER } from './Instagram';
import { WHATSAPP_CHANNEL_URL } from './WhatsAppChannel';
import { notify } from '../../services/notificationService';

const KEY = 'mf_follow';
const OPENS = 'mf_opens';
interface FollowState { ig?: boolean; wa?: boolean; asks: number; next: number }
const read = (): FollowState => { try { return { asks: 0, next: 0, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return { asks: 0, next: 0 }; } };
const write = (s: FollowState) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* sin almacenamiento */ } };

type Step = 'ig' | 'wa';
const STEPS: Record<Step, { strip: string; label: string; ring: string; icon: typeof Instagram; title: React.ReactNode; text: string; perks: string[]; cta: string; ctaCls: string; url: string }> = {
  ig: {
    strip: 'from-fuchsia-300 via-rose-300 to-amber-300', label: '📸 SÍGUENOS EN INSTAGRAM', ring: '#F0ABFC', icon: Instagram,
    title: <>Síguenos en <span className="text-fuchsia-300">@{INSTAGRAM_USER}</span></>,
    text: 'Tips para que te rinda la plata, novedades de la app y retos de ahorro.',
    perks: ['💡 Tips de ahorro', '🆕 Novedades', '🏆 Retos'],
    cta: 'Seguir en Instagram', ctaCls: 'bg-gradient-to-r from-fuchsia-300 via-rose-300 to-amber-300 text-[#2A0A1F]', url: INSTAGRAM_URL,
  },
  wa: {
    strip: 'from-lime-200 via-emerald-300 to-teal-400', label: '💬 ÚNETE AL CANAL DE WHATSAPP', ring: '#6EE7B7', icon: MessageCircle,
    title: <>El canal de <span className="text-emerald-300">Mi Finanzas</span></>,
    text: 'Te avisamos de cada actualización y de fechas clave (prima, pagos de fin de mes). Solo nosotros escribimos: sin grupos ni cadenas.',
    perks: ['🔔 Actualizaciones', '📅 Fechas clave', '🔕 Sin spam'],
    cta: 'Unirme al canal', ctaCls: 'bg-gradient-to-r from-lime-200 to-emerald-400 text-[#05231A]', url: WHATSAPP_CHANNEL_URL,
  },
};

export default function FollowUs({ ready }: { ready: boolean }) {
  const [queue, setQueue] = useState<Step[]>([]);
  const [i, setI] = useState(0);
  const [open, setOpen] = useState(false);

  // Cuenta las aperturas (una por sesión)
  useEffect(() => {
    try { if (!sessionStorage.getItem('mf_opened')) { sessionStorage.setItem('mf_opened', '1'); localStorage.setItem(OPENS, String(Number(localStorage.getItem(OPENS) || 0) + 1)); } } catch { /* nada */ }
  }, []);

  useEffect(() => {
    if (!ready) return;
    const s = read();
    const opens = Number(localStorage.getItem(OPENS) || 0);
    const steps = (['ig', 'wa'] as Step[]).filter(k => !s[k]);
    if (!steps.length || opens < 3 || s.asks >= 3 || Date.now() < s.next) return;
    // Solo si en esta apertura no salió otra ventana
    let busy = false;
    const t1 = setTimeout(() => { if (document.querySelector('[role="dialog"]')) busy = true; }, 2500);
    const t2 = setTimeout(() => {
      if (busy || document.querySelector('[role="dialog"]')) return;
      setQueue(steps); setI(0); setOpen(true);
      write({ ...s, asks: s.asks + 1, next: Date.now() + 14 * 86400000 });
    }, 6000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [ready]);

  const step = queue[i];
  const next = () => { if (i + 1 < queue.length) setI(i + 1); else setOpen(false); };
  const follow = (k: Step) => {
    window.open(STEPS[k].url, '_blank', 'noopener,noreferrer');
    write({ ...read(), [k]: true });
    if (i + 1 >= queue.length) notify({ title: '¡Gracias por acompañarnos! 💚', type: 'success', log: false });
    next();
  };
  if (!step) return null;
  const d = STEPS[step]; const Icon = d.icon;
  const pct = ((i + 1) / queue.length) * 100;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[150] bg-black/75 backdrop-blur-sm flex items-center justify-center p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div key={step} role="dialog" aria-modal="true" aria-labelledby="follow-title"
            initial={{ y: -60, scale: 0.9, opacity: 0, rotate: -2 }} animate={{ y: 0, scale: 1, opacity: 1, rotate: 0 }} exit={{ y: 40, opacity: 0 }} transition={{ type: 'spring', damping: 17, stiffness: 240 }}
            className="theme-dark relative w-full max-w-sm overflow-hidden rounded-[30px] bg-[#121938] border border-white/10 shadow-2xl shadow-black/60">
            <div className={`relative px-5 pt-4 pb-10 bg-gradient-to-br ${d.strip}`}>
              <div aria-hidden="true" className="absolute -right-6 -top-8 w-32 h-32 rounded-full bg-white/25 blur-2xl" />
              <div className="relative flex items-center justify-between gap-2">
                <p className="text-[11px] font-extrabold tracking-widest text-[#0B1026]">{d.label}</p>
                <button onClick={() => setOpen(false)} aria-label="Cerrar" className="p-1 text-[#0B1026]/70"><X size={18} /></button>
              </div>
              {queue.length > 1 && <span className="relative inline-flex mt-2 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-[#0B1026] text-white">{i + 1} DE {queue.length}</span>}
            </div>
            <div className="relative -mt-9 flex justify-center">
              <motion.div initial={{ rotateY: 180, scale: 0.6 }} animate={{ rotateY: 0, scale: 1 }} transition={{ delay: 0.15, duration: 0.6 }}
                className="w-[76px] h-[76px] rounded-full p-[4px]" style={{ background: `conic-gradient(${d.ring} ${pct * 3.6}deg, rgba(255,255,255,.12) 0deg)` }}>
                <div className="w-full h-full rounded-full bg-[#121938] flex items-center justify-center"><Icon size={32} style={{ color: d.ring }} /></div>
              </motion.div>
            </div>
            <div className="px-5 pb-5 pt-2 text-center">
              <h2 id="follow-title" className="text-white text-lg font-extrabold">{d.title}</h2>
              <p className="text-[13px] text-slate-300 mt-1.5">{d.text}</p>
              <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                {d.perks.map(p => <span key={p} className="px-2.5 py-1 rounded-full bg-white/[0.06] ring-1 ring-white/10 text-[11px] font-bold text-white">{p}</span>)}
              </div>
              <div className="mt-5 space-y-2">
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => follow(step)} className={`w-full py-3.5 rounded-2xl font-extrabold flex items-center justify-center gap-2 ${d.ctaCls}`}><Icon size={19} /> {d.cta}</motion.button>
                <button onClick={next} className="w-full h-12 rounded-2xl bg-white/[0.07] ring-1 ring-white/10 text-white font-bold flex items-center justify-center gap-2">
                  {i + 1 < queue.length ? <>Ahora no <ArrowRight size={16} /></> : 'Ahora no'}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-3">Se abre {step === 'ig' ? 'Instagram' : 'WhatsApp'}. La app no ve tu cuenta.</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
