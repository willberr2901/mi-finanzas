/**
 * ════════════════════════════════════════════════════════════════════
 * 🔔 AVISO DE PRÉSTAMOS DENTRO DE LA APP (tarjeta diseñada)
 * ────────────────────────────────────────────────────────────────────
 * Sale al abrir la app (una vez al día) si hay préstamos que vencen pronto, hoy,
 * ya vencidos, o si alguien te debe desde hace 15 días o más.
 *   • "Yo debo"  → franja naranja "TIENES UN PAGO PENDIENTE" · Ya le pagué / Abonar una parte.
 *   • "Me deben" → franja verde "TE DEBEN PLATA" · Recordarle por WhatsApp / Me abonó.
 *   • "Recuérdamelo mañana" lo calla por hoy. Si hay varios, se pasan con las flechas.
 * Los avisos con la app cerrada los muestra el service worker (src/sw.ts → checkLoans).
 * Datos: services/loansService.ts (loanAlerts, alertLabel, snoozeLoan).
 * ════════════════════════════════════════════════════════════════════
 */
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, animate } from 'framer-motion';
import { MessageCircle, Check, AlarmClock, ChevronLeft, ChevronRight, X, HandCoins } from 'lucide-react';
import { formatCOP } from '../../utils/format';
import { notify } from '../../services/notificationService';
import { loanAlerts, alertLabel, snoozeLoan, isSnoozedToday, addPayment, leftOf, paidOf, reminderText, today, type LoanAlert } from '../../services/loansService';

const DAY_KEY = 'mf_loan_popup_day';
const fmtDate = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });

/** Número que sube contando (como en un tablero). */
function CountUp({ value }: { value: number }) {
  const [v, setV] = useState(0);
  useEffect(() => { const c = animate(0, value, { duration: 0.9, ease: 'easeOut', onUpdate: n => setV(n) }); return () => c.stop(); }, [value]);
  return <>{formatCOP(Math.round(v))}</>;
}

export default function LoanReminder({ ready }: { ready: boolean }) {
  const navigate = useNavigate();
  const [list, setList] = useState<LoanAlert[]>([]);
  const [i, setI] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!ready) return;
    try { if (localStorage.getItem(DAY_KEY) === today()) return; } catch { /* sin almacenamiento */ }
    const items = loanAlerts().filter(a => !isSnoozedToday(a.loan.id));
    if (!items.length) return;
    let tries = 0;
    // Espera a que no haya otra ventana abierta (entrada de temporada, novedades…)
    let t = setTimeout(function check() {
      if (document.querySelector('[role="dialog"]') && tries++ < 60) { t = setTimeout(check, 1500); return; }
      setList(items); setI(0); setOpen(true);
      try { localStorage.setItem(DAY_KEY, today()); } catch { /* sin almacenamiento */ }
    }, 1800);
    return () => clearTimeout(t);
  }, [ready]);

  const a = list[i];
  const close = () => setOpen(false);
  const next = () => { if (i + 1 < list.length) setI(i + 1); else close(); };
  const drop = () => { const rest = list.filter((_, n) => n !== i); setList(rest); if (!rest.length) close(); else setI(Math.min(i, rest.length - 1)); };

  if (!a) return null;
  const l = a.loan;
  const debo = l.dir === 'debo';
  const paid = paidOf(l);
  const pct = Math.round((paid / l.amount) * 100);
  const urgent = a.kind === 'vencido' || a.kind === 'hoy';

  const paidAll = () => {
    addPayment(l.id, leftOf(l));
    notify({ title: '¡A paz y salvo! 🎉', message: `Ya no le debes nada a ${l.person}.`, type: 'success' });
    drop();
  };
  const remind = () => { window.open(`https://wa.me/?text=${encodeURIComponent(reminderText(l, formatCOP))}`, '_blank', 'noopener,noreferrer'); snoozeLoan(l.id); next(); };
  const goPay = () => { close(); navigate(`/prestamos?abonar=${l.id}`); };
  const later = () => { snoozeLoan(l.id); drop(); };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[155] bg-black/75 backdrop-blur-sm flex items-center justify-center p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close}>
          <motion.div key={l.id} role="dialog" aria-modal="true" aria-labelledby="loan-rem-title" onClick={e => e.stopPropagation()}
            initial={{ y: -60, scale: 0.9, opacity: 0, rotate: -2 }} animate={{ y: 0, scale: 1, opacity: 1, rotate: 0 }} exit={{ y: 40, opacity: 0 }} transition={{ type: 'spring', damping: 17, stiffness: 240 }}
            className="theme-dark relative w-full max-w-sm overflow-hidden rounded-[30px] bg-[#121938] border border-white/10 shadow-2xl shadow-black/60">
            {/* Franja de color */}
            <div className={`relative px-5 pt-4 pb-10 ${debo ? 'bg-gradient-to-br from-amber-300 via-orange-400 to-orange-600' : 'bg-gradient-to-br from-lime-200 via-lime-300 to-emerald-500'}`}>
              <div aria-hidden="true" className="absolute -right-6 -top-8 w-32 h-32 rounded-full bg-white/25 blur-2xl" />
              <div className="relative flex items-center justify-between gap-2">
                <p className="text-[11px] font-extrabold tracking-widest text-[#1A1200]">{debo ? '💸 TIENES UN PAGO PENDIENTE' : '🤝 TE DEBEN PLATA'}</p>
                <button onClick={close} aria-label="Cerrar" className="p-1 text-[#1A1200]/70"><X size={18} /></button>
              </div>
              <motion.span animate={urgent ? { scale: [1, 1.08, 1] } : {}} transition={{ duration: 1.2, repeat: Infinity }}
                className={`relative inline-flex mt-2 px-2.5 py-1 rounded-full text-[11px] font-extrabold ${a.kind === 'vencido' ? 'bg-rose-600 text-white' : a.kind === 'hoy' ? 'bg-[#1A1200] text-white' : 'bg-white/60 text-[#1A1200]'}`}>
                {alertLabel(a).toUpperCase()}{l.due ? ` · ${fmtDate(l.due)}` : ''}
              </motion.span>
            </div>

            {/* Avatar que se monta sobre la franja */}
            <div className="relative -mt-9 flex justify-center">
              <motion.div initial={{ rotateY: 180, scale: 0.6 }} animate={{ rotateY: 0, scale: 1 }} transition={{ delay: 0.15, duration: 0.6 }}
                className="w-[76px] h-[76px] rounded-full p-[4px]" style={{ background: `conic-gradient(${debo ? '#FB923C' : '#C6F432'} ${pct * 3.6}deg, rgba(255,255,255,.12) 0deg)` }}>
                <div className={`w-full h-full rounded-full bg-[#121938] flex items-center justify-center text-3xl font-extrabold ${debo ? 'text-orange-300' : 'text-brand-lime'}`}>{l.person.charAt(0).toUpperCase()}</div>
              </motion.div>
            </div>

            <div className="px-5 pb-5 pt-2 text-center">
              <h2 id="loan-rem-title" className="text-white text-lg font-extrabold">{debo ? <>Le debes a <span className="text-orange-300">{l.person}</span></> : <><span className="text-brand-lime">{l.person}</span> te debe</>}</h2>
              <p className={`text-[40px] font-extrabold leading-tight tracking-tight ${debo ? 'text-orange-300' : 'text-brand-lime'}`}><CountUp value={leftOf(l)} /></p>
              <p className="text-xs text-slate-300">{l.reason ? `Por ${l.reason.toLowerCase()} · ` : ''}desde el {fmtDate(l.date)}</p>
              {paid > 0 && (
                <div className="mt-3 text-left">
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden"><motion.div className={`h-full rounded-full ${debo ? 'bg-orange-400' : 'bg-brand-lime'}`} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.3, duration: 0.8 }} /></div>
                  <p className="text-[11px] text-slate-400 mt-1">{debo ? 'Ya abonaste' : 'Ya te abonó'} {formatCOP(paid)} de {formatCOP(l.amount)}</p>
                </div>
              )}

              <div className="mt-5 space-y-2">
                {debo ? (<>
                  <motion.button whileTap={{ scale: 0.96 }} onClick={paidAll} className="w-full h-13 py-3.5 rounded-2xl bg-gradient-to-r from-amber-300 to-orange-500 text-[#1A1200] font-extrabold flex items-center justify-center gap-2"><Check size={19} strokeWidth={3} /> Ya le pagué todo</motion.button>
                  <button onClick={goPay} className="w-full h-12 rounded-2xl bg-white/[0.07] ring-1 ring-white/10 text-white font-bold flex items-center justify-center gap-2"><HandCoins size={17} /> Abonar una parte</button>
                </>) : (<>
                  <motion.button whileTap={{ scale: 0.96 }} onClick={remind} className="w-full h-13 py-3.5 rounded-2xl bg-brand-lime text-brand-ink font-extrabold flex items-center justify-center gap-2"><MessageCircle size={19} /> Recordarle por WhatsApp</motion.button>
                  <button onClick={goPay} className="w-full h-12 rounded-2xl bg-white/[0.07] ring-1 ring-white/10 text-white font-bold flex items-center justify-center gap-2"><Check size={17} strokeWidth={3} /> Me abonó</button>
                </>)}
              </div>

              <div className="mt-3 flex items-center justify-between">
                {list.length > 1
                  ? <button onClick={() => setI((i - 1 + list.length) % list.length)} aria-label="Anterior" className="p-2 text-slate-400"><ChevronLeft size={18} /></button>
                  : <span className="w-9" />}
                <button onClick={later} className="text-xs font-bold text-slate-400 flex items-center gap-1.5"><AlarmClock size={14} /> Recuérdamelo mañana</button>
                {list.length > 1
                  ? <button onClick={() => setI((i + 1) % list.length)} aria-label="Siguiente" className="p-2 text-slate-400 flex items-center gap-1 text-[11px] font-bold">{i + 1}/{list.length}<ChevronRight size={18} /></button>
                  : <span className="w-9" />}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
