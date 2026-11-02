/**
 * ════════════════════════════════════════════════════════════════════
 * 🔄 POPUPS DE DEUDAS DEL HOGAR
 * ────────────────────────────────────────────────────────────────────
 * • Preguntar: "¿Sincronizar tus deudas con el hogar?" con casillas para elegir
 *   cuáles (las personales se quedan solo tuyas).
 * • Aprobar: "Gato quiere compartir 2 deudas contigo" → Aprobar / No por ahora.
 * Sale sola una vez (al tener hogar y deudas) y cuando llega una solicitud.
 * También se abre desde Pagos con el botón "Sincronizar" (evento 'mf:open-debt-sync').
 * ════════════════════════════════════════════════════════════════════
 */
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { Bill } from '../../utils/database';
import { formatCOP } from '../../utils/format';
import { haptic } from '../../utils/haptics';
import { getHousehold } from '../../services/household/householdSync';
import { unsharedDebts, offerDebts, answerOffer, incomingOffers, markAsked, wasAsked, type DebtOffer } from '../../services/household/debtSync';

const emoji = (name: string, kind: string) => kind === 'tarjeta' || /tarjeta/i.test(name) ? '💳' : /celular|tel[eé]fono/i.test(name) ? '📱' : /moto|carro|veh/i.test(name) ? '🏍️' : /pr[eé]stamo/i.test(name) ? '🤝' : '🏦';

type Mode = { kind: 'offer'; debts: Bill[] } | { kind: 'approve'; offer: DebtOffer };

function Card({ mode, onClose }: { mode: Mode; onClose: () => void }) {
  const h = getHousehold();
  const [sel, setSel] = useState<Set<string>>(() => new Set(mode.kind === 'offer' ? mode.debts.map(d => d.id) : []));
  const [busy, setBusy] = useState(false);
  const offer = mode.kind === 'offer';
  const strip = offer ? 'from-lime-200 via-emerald-300 to-teal-300' : 'from-pink-300 via-violet-300 to-sky-300';
  const ring = offer ? '#6EE7B7' : '#F9A8D4';

  const yes = async () => {
    setBusy(true); haptic('success');
    try {
      if (mode.kind === 'offer') await offerDebts(mode.debts.filter(d => sel.has(d.id)));
      else await answerOffer(mode.offer, true);
    } finally { setBusy(false); onClose(); }
  };
  const no = async () => {
    if (mode.kind === 'offer') markAsked(); else await answerOffer(mode.offer, false);
    onClose();
  };

  return (
    <motion.div className="fixed inset-0 z-[175] bg-black/75 backdrop-blur-sm flex items-center justify-center p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div role="dialog" aria-modal="true" aria-labelledby="ds-title" initial={{ y: -50, scale: 0.92, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 18, stiffness: 240 }} className="theme-dark relative w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-[30px] bg-[#121938] border border-white/10 shadow-2xl shadow-black/60">
        <div className={`relative px-5 pt-4 pb-10 bg-gradient-to-br ${strip}`}>
          <div aria-hidden="true" className="pointer-events-none absolute -right-6 -top-8 w-32 h-32 rounded-full bg-white/25 blur-2xl" />
          <div className="relative z-10 flex items-center justify-between gap-2">
            <p className="text-[11px] font-extrabold tracking-widest text-[#0B1026] truncate">{offer ? `🏠 HOGAR “${(h?.name ?? 'MI HOGAR').toUpperCase()}”` : '💌 SOLICITUD DEL HOGAR'}</p>
            <button onClick={no} aria-label="Cerrar" className="p-1 text-[#0B1026]/70"><X size={18} /></button>
          </div>
        </div>
        <div className="relative z-10 -mt-9 flex justify-center">
          <motion.div initial={{ rotate: -90, scale: 0.6 }} animate={{ rotate: 0, scale: 1 }} transition={{ delay: 0.1 }} className="w-[72px] h-[72px] rounded-full p-[4px]" style={{ background: `conic-gradient(${ring} 270deg, rgba(255,255,255,.12) 0deg)` }}>
            <div className="w-full h-full rounded-full bg-[#121938] flex items-center justify-center text-[30px]">{offer ? '🔄' : '🤝'}</div>
          </motion.div>
        </div>
        <div className="px-5 pb-5 pt-2 text-center text-white">
          {mode.kind === 'offer' ? (
            <>
              <h2 id="ds-title" className="text-[18px] font-extrabold">¿Sincronizar tus deudas con el hogar?</h2>
              <p className="text-[13px] text-slate-300 mt-1.5">Así los dos ven las mismas cuotas, quién pagó y cuánto falta. Elige cuáles:</p>
              <div className="mt-3 space-y-2 text-left">
                {mode.debts.map(d => {
                  const on = sel.has(d.id);
                  return (
                    <button key={d.id} role="checkbox" aria-checked={on} onClick={() => { haptic('light'); setSel(s => { const n = new Set(s); if (n.has(d.id)) n.delete(d.id); else n.add(d.id); return n; }); }}
                      className={`w-full flex items-center gap-2.5 rounded-2xl p-2.5 ring-1 transition-colors ${on ? 'bg-emerald-400/10 ring-emerald-300/40' : 'bg-white/[0.04] ring-white/10'}`}>
                      <span className={`w-[22px] h-[22px] rounded-[7px] flex items-center justify-center text-[13px] font-black shrink-0 ${on ? 'bg-brand-lime text-brand-ink' : 'bg-white/10 text-transparent'}`}>✓</span>
                      <span className="text-xl" aria-hidden="true">{emoji(d.name, d.kind)}</span>
                      <span className="flex-1 min-w-0"><span className="block font-bold text-[13.5px] truncate">{d.name}</span>
                        <span className="block text-[11.5px] text-slate-400">{on ? `${formatCOP(d.amount)}/mes${d.totalInstallments ? ` · ${d.totalInstallments - (d.paidInstallments ?? 0)} cuotas` : ''}` : 'Solo mía · no se comparte'}</span></span>
                    </button>
                  );
                })}
              </div>
              <motion.button whileTap={{ scale: 0.97 }} disabled={busy || !sel.size} onClick={yes} className="mt-4 w-full py-3.5 rounded-2xl font-extrabold bg-gradient-to-r from-lime-300 to-emerald-300 text-[#0B1026] disabled:opacity-50">
                🔄 Sí, sincronizar {sel.size === 1 ? '1 deuda' : `${sel.size} deudas`}
              </motion.button>
            </>
          ) : (
            <>
              <h2 id="ds-title" className="text-[18px] font-extrabold"><span className="text-pink-300">{mode.offer.from}</span> quiere compartir {mode.offer.debts.length === 1 ? '1 deuda' : `${mode.offer.debts.length} deudas`} contigo</h2>
              <p className="text-[13px] text-slate-300 mt-1.5">Si aceptas, aparecen en tu Pagos y cuando uno pague, el otro lo ve al instante.</p>
              <div className="mt-3 space-y-2 text-left">
                {mode.offer.debts.map(d => (
                  <div key={d.id} className="flex items-center gap-2.5 rounded-2xl p-2.5 bg-white/[0.04] ring-1 ring-white/10">
                    <span className="text-xl" aria-hidden="true">{emoji(d.name, d.kind)}</span>
                    <span className="flex-1 min-w-0"><span className="block font-bold text-[13.5px] truncate">{d.name}</span><span className="block text-[11.5px] text-slate-400">{formatCOP(d.amount)}/mes · vence el {d.dueDay}</span></span>
                  </div>
                ))}
              </div>
              <motion.button whileTap={{ scale: 0.97 }} disabled={busy} onClick={yes} className="mt-4 w-full py-3.5 rounded-2xl font-extrabold bg-gradient-to-r from-pink-300 to-violet-300 text-[#0B1026] disabled:opacity-50">✅ Aprobar y sincronizar</motion.button>
            </>
          )}
          <button onClick={no} className="mt-2 w-full h-12 rounded-2xl bg-white/[0.07] ring-1 ring-white/10 font-bold">{offer ? 'Ahora no' : 'No por ahora'}</button>
          <p className="text-[10.5px] text-slate-500 mt-3">{offer ? '🔒 Cifrado de extremo a extremo. Puedes dejar de compartir cuando quieras.' : 'Nadie más ve esto: solo los celulares de tu hogar.'}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

/** Va en App.tsx: decide cuándo mostrar cada popup. */
export default function DebtSyncHost({ ready }: { ready: boolean }) {
  const [mode, setMode] = useState<Mode | null>(null);

  const openBest = async (auto = false) => {
    if (!getHousehold()) return;
    const inc = incomingOffers(!auto);
    if (inc.length) { setMode({ kind: 'approve', offer: inc[0] }); return; }
    if (auto && wasAsked()) return;
    const debts = await unsharedDebts();
    if (debts.length) setMode({ kind: 'offer', debts });
  };

  useEffect(() => {
    const onOffer = (e: Event) => { const o = (e as CustomEvent).detail as DebtOffer; if (o) setMode({ kind: 'approve', offer: o }); };
    const onOpen = () => openBest(false);
    window.addEventListener('mf:debt-offer', onOffer);
    window.addEventListener('mf:open-debt-sync', onOpen);
    return () => { window.removeEventListener('mf:debt-offer', onOffer); window.removeEventListener('mf:open-debt-sync', onOpen); };
  }, []);

  // Sola, una vez: unos segundos después de abrir, si no hay otra ventana
  useEffect(() => {
    if (!ready) return;
    // Si hay otra ventana abierta, vuelve a intentar (hasta 3 veces) para no salir encima de otra
    let tries = 0; let t: ReturnType<typeof setTimeout>;
    const attempt = () => { if (!document.querySelector('[role="dialog"]')) openBest(true); else if (++tries < 3) t = setTimeout(attempt, 15000); };
    t = setTimeout(attempt, 4500);
    return () => clearTimeout(t);
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

  return createPortal(<AnimatePresence>{mode && <Card key={mode.kind} mode={mode} onClose={() => setMode(null)} />}</AnimatePresence>, document.body);
}
